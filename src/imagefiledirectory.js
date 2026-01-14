import DataSlice from './dataslice.js';

import {
  fieldTypes,
  geoKeyNames,
  tagDefinitions,
  resolveTag,
  getFieldTypeSize,
} from './globals.js';

function getArrayForSamples(fieldType, count) {
  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      return new Uint8Array(count);
    case fieldTypes.SBYTE:
      return new Int8Array(count);
    case fieldTypes.SHORT:
      return new Uint16Array(count);
    case fieldTypes.SSHORT:
      return new Int16Array(count);
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      return new Uint32Array(count);
    case fieldTypes.SLONG:
      return new Int32Array(count);
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      return new Array(count);
    case fieldTypes.SLONG8:
      return new Array(count);
    case fieldTypes.RATIONAL:
      return new Uint32Array(count * 2);
    case fieldTypes.SRATIONAL:
      return new Int32Array(count * 2);
    case fieldTypes.FLOAT:
      return new Float32Array(count);
    case fieldTypes.DOUBLE:
      return new Float64Array(count);
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }
}

function getDataSliceReader(dataSlice, fieldType) {
  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      return dataSlice.readUint8;
    case fieldTypes.SBYTE:
      return dataSlice.readInt8;
    case fieldTypes.SHORT:
      return dataSlice.readUint16;
    case fieldTypes.SSHORT:
      return dataSlice.readInt16;
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      return dataSlice.readUint32;
    case fieldTypes.SLONG:
      return dataSlice.readInt32;
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      return dataSlice.readUint64;
    case fieldTypes.SLONG8:
      return dataSlice.readInt64;
    case fieldTypes.RATIONAL:
      return dataSlice.readUint32;
    case fieldTypes.SRATIONAL:
      return dataSlice.readInt32;
    case fieldTypes.FLOAT:
      return dataSlice.readFloat32;
    case fieldTypes.DOUBLE:
      return dataSlice.readFloat64;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }
}

function getValues(outValues = null, readMethod, dataSlice, fieldType, count, offset, isArray) {
  const fieldTypeLength = getFieldTypeSize(fieldType);

  const values = outValues || getArrayForSamples(fieldType, count);
  // const readMethod = getDataSliceReader(dataSlice, fieldType);
  const isRational = (
    fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL
  );

  // normal fields
  if (!isRational) {
    for (let i = 0; i < count; ++i) {
      values[i] = readMethod.call(dataSlice, offset + (i * fieldTypeLength));
    }
  } else {
    // RATIONAL or SRATIONAL
    for (let i = 0; i < count; i += 2) {
      values[i] = readMethod.call(dataSlice, offset + (i * fieldTypeLength));
      values[i + 1] = readMethod.call(
        dataSlice,
        offset + ((i * fieldTypeLength) + 4),
      );
    }
  }

  if (fieldType === fieldTypes.ASCII) {
    return new TextDecoder('utf-8').decode(values);
  }

  if (count === 1 && !isArray && !isRational) {
    return values[0];
  }
  return values;
}

class DeferredArray {
  constructor(source, arrayOffset, littleEndian, fieldType, length) {
    this.source = source;
    this.arrayOffset = arrayOffset;
    this.littleEndian = littleEndian;
    this.fieldType = fieldType;
    this.length = length;
    this.data = getArrayForSamples(fieldType, length);
    this.itemSize = getFieldTypeSize(fieldType);
    this.maskBitmap = new Uint8Array(Math.ceil(length / 8));
    this.fetchIndexPromises = new Map();
    this.fullFetchPromise = null;
  }

  async loadAll() {
    if (!this.fullFetchPromise) {
      this.fullFetchPromise = this.source.fetch([{
        offset: this.arrayOffset,
        length: this.itemSize * this.length,
      }]).then((data) => {
        const dataSlice = new DataSlice(
          data[0],
          this.arrayOffset,
          true,
          false, // we can ignore bigTiff here
        );
        return getValues(
          this.data,
          getDataSliceReader(dataSlice, this.fieldType),
          dataSlice,
          this.fieldType,
          this.length,
          this.arrayOffset,
          true,
        );
      });
    }
    return this.fullFetchPromise;
  }

  async get(index) {
    if (index < 0 || index >= this.data.length) {
      throw new RangeError(
        `Index ${index} out of bounds for length ${this.data.length}`,
      );
    }

    const byteIndex = Math.floor(index / 8);
    const bitMask = 1 << index % 8;
    const offset = this.arrayOffset + (index * this.itemSize);

    if ((this.maskBitmap[byteIndex] & bitMask) === 0) {
      if (!this.fetchIndexPromises.has(index)) {
        const fetchPromise = this.source.fetch([{
          offset,
          length: this.itemSize,
        }]).then((data) => {
          const dataSlice = new DataSlice(
            data[0],
            this.arrayOffset + (index * this.itemSize),
            true,
            false, // we can ignore bigTiff here
          );
          const readMethod = getDataSliceReader(dataSlice, this.fieldType);
          const value = readMethod.call(dataSlice, offset);

          this.data[index] = value;
          this.maskBitmap[byteIndex] |= bitMask;
          this.fetchIndexPromises.delete(index);
          return value;
        });
        this.fetchIndexPromises.set(index, fetchPromise);
      }
      return this.fetchIndexPromises.get(index);
    }
    return this.data[index];
  }
}

export class ImageFileDirectory {
  /**
   * Create an ImageFileDirectory.
   * @param {Map} actualizedFields the file directory, mapping tag names to values
   * @param {Map} deferredFields the deferred fields, mapping tag names to async functions
   * @param {Map} deferredArrays the deferred arrays, mapping tag names to DeferredArray objects
   * @param {number} nextIFDByteOffset the byte offset to the next IFD
   */
  constructor(actualizedFields, deferredFields, deferredArrays, nextIFDByteOffset) {
    this.actualizedFields = actualizedFields;
    this.deferredFields = deferredFields;
    this.deferredFieldsBeingResolved = new Map();
    this.deferredArrays = deferredArrays;
    this.nextIFDByteOffset = nextIFDByteOffset;
  }

  /**
   * @param {number|string} tagIdentifier The field tag ID or name
   * @returns {boolean} whether the field exists (actualized or deferred)
   */
  hasTag(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    return this.actualizedFields.has(tag) || this.deferredFields.has(tag) || this.deferredArrays.has(tag);
  }

  /**
   * Synchronously retrieves the value for a given tag. If it is deferred, an error is thrown.
   * @param {number|string} tagIdentifier The field tag ID or name
   * @returns the field value, or undefined if it is deferred or does not exist
   */
  getValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    if (!this.actualizedFields.has(tag)) {
      if (this.deferredFields.has(tag) || this.deferredArrays.has(tag)) {
        throw new Error(`Field ${tag} is deferred, use loadValue() to load it asynchronously`);
      }
      return undefined;
    }
    return this.actualizedFields.get(tag);
  }

  /**
   * Retrieves the value for a given tag. If it is deferred, it will be loaded first.
   * @param {number|string} tagIdentifier The field tag ID or name
   * @returns the field value, or undefined if it does not exist
   */
  async loadValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    if (this.actualizedFields.has(tag)) {
      return this.actualizedFields.get(tag);
    }
    if (this.deferredFieldsBeingResolved.has(tag)) {
      return this.deferredFieldsBeingResolved.get(tag);
    }
    if (this.deferredFields.has(tag)) {
      const valuePromise = this.deferredFields.get(tag)();
      this.deferredFields.delete(tag);
      this.deferredFieldsBeingResolved.set(tag, valuePromise);
      const value = await valuePromise;
      this.deferredFieldsBeingResolved.delete(tag);
      this.actualizedFields.set(tag, value);
      return value;
    }
    if (this.deferredArrays.has(tag)) {
      const deferredArray = this.deferredArrays.get(tag);
      return deferredArray.loadAll();
    }

    return undefined;
  }

  /**
   * Retrieves the value at a given index for a tag that is an array. If it is deferred, it will be loaded first.
   * @param {number|string} tagIdentifier The field tag ID or name
   * @param {number} index The index within the array
   * @returns the field value at the given index, or undefined if it does not exist
   */
  async loadValueIndexed(tagIdentifier, index) {
    const tag = resolveTag(tagIdentifier);
    if (this.actualizedFields.has(tag)) {
      const value = this.actualizedFields.get(tag);
      return value[index];
    } else if (this.deferredArrays.has(tag)) {
      const deferredArray = this.deferredArrays.get(tag);
      return deferredArray.get(index);
    } else if (this.hasTag(tag)) {
      return (await this.loadValue(tag))[index];
    }
    return undefined;
  }

  parseGeoKeyDirectory() {
    const rawGeoKeyDirectory = this.getValue('GeoKeyDirectory');
    if (!rawGeoKeyDirectory) {
      return null;
    }

    const geoKeyDirectory = {};
    for (let i = 4; i <= rawGeoKeyDirectory[3] * 4; i += 4) {
      const key = geoKeyNames[rawGeoKeyDirectory[i]];
      const location = rawGeoKeyDirectory[i + 1] || null;
      const count = rawGeoKeyDirectory[i + 2];
      const offset = rawGeoKeyDirectory[i + 3];

      let value = null;
      if (!location) {
        value = offset;
      } else {
        value = this.getValue(location);
        if (typeof value === 'undefined' || value === null) {
          throw new Error(`Could not get value of geoKey '${key}'.`);
        } else if (typeof value === 'string') {
          value = value.substring(offset, offset + count - 1);
        } else if (value.subarray) {
          value = value.subarray(offset, offset + count);
          if (count === 1) {
            value = value[0];
          }
        }
      }
      geoKeyDirectory[key] = value;
    }
    return geoKeyDirectory;
  }

  toObject() {
    const obj = {};
    for (const [tag, value] of this.actualizedFields.entries()) {
      const tagDefinition = tagDefinitions[tag];
      const tagName = tagDefinition ? tagDefinition.name : `Tag${tag}`;
      obj[tagName] = value;
    }
    return obj;
  }
}

/**
 * Parser for Image File Directories (IFDs).
 */
export class ImageFileDirectoryParser {
  /**
   * @param {import("./source/basesource.js").BaseSource} source the data source to fetch from
   * @param {boolean} littleEndian the endianness of the file
   * @param {boolean} bigTiff whether the file is a BigTIFF
   * @param {boolean} [eager=true] whether to eagerly fetch deferred fields
   */
  constructor(source, littleEndian, bigTiff, eager = true) {
    this.source = source;
    this.littleEndian = littleEndian;
    this.bigTiff = bigTiff;
    this.eager = eager;
  }

  /**
   * Helper function to retrieve a DataSlice from the source.
   * @param {number} offset Byte offset of the slice
   * @param {number} [length] Length of the slice
   * @returns {Promise<DataSlice>}
   */
  async getSlice(offset, length) {
    const fallbackLength = this.bigTiff ? 4048 : 1024;
    return new DataSlice(
      (
        await this.source.fetch([
          {
            offset,
            length: typeof length !== 'undefined' ? length : fallbackLength,
          },
        ])
      )[0],
      offset,
      this.littleEndian,
      this.bigTiff,
    );
  }

  /**
   * Instructs to parse an image file directory at the given file offset.
   * As there is no way to ensure that a location is indeed the start of an IFD,
   * this function must be called with caution (e.g only using the IFD offsets from
   * the headers or other IFDs).
   * @param {number} offset the offset to parse the IFD at
   * @returns {Promise<ImageFileDirectory>} the parsed IFD
   */
  async parseFileDirectoryAt(offset) {
    const entrySize = this.bigTiff ? 20 : 12;
    const offsetSize = this.bigTiff ? 8 : 2;

    let dataSlice = await this.getSlice(offset);
    const numDirEntries = this.bigTiff
      ? dataSlice.readUint64(offset)
      : dataSlice.readUint16(offset);

    // if the slice does not cover the whole IFD, request a bigger slice, where the
    // whole IFD fits: num of entries + n x tag length + offset to next IFD
    const byteSize = numDirEntries * (entrySize + (this.bigTiff ? 16 : 6));
    if (!dataSlice.covers(offset, byteSize)) {
      dataSlice = await this.getSlice(offset, byteSize);
    }

    const actualizedFields = new Map();
    const deferredFields = new Map();
    const deferredArrays = new Map();

    // loop over the IFD and create a file directory object
    let i = offset + (this.bigTiff ? 8 : 2);
    for (
      let entryCount = 0;
      entryCount < numDirEntries;
      i += entrySize, ++entryCount
    ) {
      const fieldTag = dataSlice.readUint16(i);
      const fieldType = dataSlice.readUint16(i + 2);
      const typeCount = this.bigTiff
        ? dataSlice.readUint64(i + 4)
        : dataSlice.readUint32(i + 4);

      let fieldValues = null;
      let deferredFieldValues = null;
      let deferredArray = null;
      const fieldTypeLength = getFieldTypeSize(fieldType);
      const valueOffset = i + (this.bigTiff ? 12 : 8);
      const isArray = tagDefinitions[fieldTag]?.isArray;
      const eager = tagDefinitions[fieldTag]?.eager || this.eager;

      // check whether the value is directly encoded in the tag or refers to a
      // different external byte range
      if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
        fieldValues = getValues(
          getArrayForSamples(fieldType, typeCount),
          getDataSliceReader(dataSlice, fieldType),
          dataSlice,
          fieldType,
          typeCount,
          valueOffset,
          isArray,
        );
      } else {
        // resolve the reference to the actual byte range
        const actualOffset = dataSlice.readOffset(valueOffset);
        const length = getFieldTypeSize(fieldType) * typeCount;

        // check, whether we actually cover the referenced byte range
        if (dataSlice.covers(actualOffset, length)) {
          fieldValues = getValues(
            getArrayForSamples(fieldType, typeCount),
            getDataSliceReader(dataSlice, fieldType),
            dataSlice,
            fieldType,
            typeCount,
            actualOffset,
            isArray,
          );
        } else if (eager) {
          // eager evaluation: fetch the data right now
          // TODO: instead of fetching the slice right here, collect all slices and fetch them together
          // to allow conjoined requests
          const fieldDataSlice = await this.getSlice(actualOffset, length);
          fieldValues = getValues(
            getArrayForSamples(fieldType, typeCount),
            getDataSliceReader(fieldDataSlice, fieldType),
            fieldDataSlice,
            fieldType,
            typeCount,
            actualOffset,
            isArray,
          );
        } else if (isArray) {
          deferredArray = new DeferredArray(
            this.source,
            actualOffset,
            this.littleEndian,
            fieldType,
            typeCount,
          );
        } else {
          deferredFieldValues = async () => {
            const fieldDataSlice = await this.getSlice(actualOffset, length);
            return getValues(
              getArrayForSamples(fieldType, typeCount),
              getDataSliceReader(fieldDataSlice, fieldType),
              fieldDataSlice,
              fieldType,
              typeCount,
              actualOffset,
              isArray,
            );
          };
        }
      }

      if (fieldValues !== null) {
        actualizedFields.set(fieldTag, fieldValues);
      } else if (deferredFieldValues !== null) {
        deferredFields.set(fieldTag, deferredFieldValues);
      } else if (deferredArray !== null) {
        deferredArrays.set(fieldTag, deferredArray);
      }
    }
    const nextIFDByteOffset = dataSlice.readOffset(
      offset + offsetSize + (entrySize * numDirEntries),
    );

    return new ImageFileDirectory(
      actualizedFields,
      deferredFields,
      deferredArrays,
      nextIFDByteOffset,
    );
  }
}
