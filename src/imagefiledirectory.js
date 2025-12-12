import DataView64 from "./dataview64.js";
import DataSlice from "./dataslice.js";

import {
  fieldTypes,
  geoKeyNames,
  tags,
  tagDefinitions,
  resolveTag,
  fieldTypeSizes,
} from "./globals.js";

function getFieldTypeLength(fieldType) {
  return fieldTypeSizes[fieldType];
}

function getValues(dataSlice, fieldType, count, offset, isArray) {
  let values = null;
  let readMethod = null;
  const fieldTypeLength = getFieldTypeLength(fieldType);

  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      values = new Uint8Array(count);
      readMethod = dataSlice.readUint8;
      break;
    case fieldTypes.SBYTE:
      values = new Int8Array(count);
      readMethod = dataSlice.readInt8;
      break;
    case fieldTypes.SHORT:
      values = new Uint16Array(count);
      readMethod = dataSlice.readUint16;
      break;
    case fieldTypes.SSHORT:
      values = new Int16Array(count);
      readMethod = dataSlice.readInt16;
      break;
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      values = new Uint32Array(count);
      readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SLONG:
      values = new Int32Array(count);
      readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      values = new Array(count);
      readMethod = dataSlice.readUint64;
      break;
    case fieldTypes.SLONG8:
      values = new Array(count);
      readMethod = dataSlice.readInt64;
      break;
    case fieldTypes.RATIONAL:
      values = new Uint32Array(count * 2);
      readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SRATIONAL:
      values = new Int32Array(count * 2);
      readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.FLOAT:
      values = new Float32Array(count);
      readMethod = dataSlice.readFloat32;
      break;
    case fieldTypes.DOUBLE:
      values = new Float64Array(count);
      readMethod = dataSlice.readFloat64;
      break;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }

  // normal fields
  if (
    !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)
  ) {
    for (let i = 0; i < count; ++i) {
      values[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
    }
  } else {
    // RATIONAL or SRATIONAL
    for (let i = 0; i < count; i += 2) {
      values[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
      values[i + 1] = readMethod.call(
        dataSlice,
        offset + (i * fieldTypeLength + 4)
      );
    }
  }

  if (fieldType === fieldTypes.ASCII) {
    return new TextDecoder("utf-8").decode(values);
  }

  if (
    count === 1 &&
    !isArray &&
    !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)
  ) {
    return values[0];
  }
  return values;
}

export class ImageFileDirectoryParser {
  constructor(source, littleEndian, bigTiff, eager = true) {
    this.source = source;
    this.littleEndian = littleEndian;
    this.bigTiff = bigTiff;
    this.eager = eager;
  }

  async getSlice(offset, size) {
    const fallbackSize = this.bigTiff ? 4048 : 1024;
    return new DataSlice(
      (
        await this.source.fetch([
          {
            offset,
            length: typeof size !== "undefined" ? size : fallbackSize,
          },
        ])
      )[0],
      offset,
      this.littleEndian,
      this.bigTiff
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
      const fieldTypeLength = getFieldTypeLength(fieldType);
      const valueOffset = i + (this.bigTiff ? 12 : 8);
      const isArray = tagDefinitions[fieldTag]?.isArray;
      const eager = tagDefinitions[fieldTag]?.eager || this.eager;

      // check whether the value is directly encoded in the tag or refers to a
      // different external byte range
      if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
        fieldValues = getValues(dataSlice, fieldType, typeCount, valueOffset, isArray);
      } else {
        // resolve the reference to the actual byte range
        const actualOffset = dataSlice.readOffset(valueOffset);
        const length = getFieldTypeLength(fieldType) * typeCount;

        // check, whether we actually cover the referenced byte range
        if (dataSlice.covers(actualOffset, length)) {
          fieldValues = getValues(
            dataSlice,
            fieldType,
            typeCount,
            actualOffset,
            isArray
          );
        } else if (eager) {
          // eager evaluation: fetch the data right now
          // TODO: instead of fetching the slice right here, collect all slices and fetch them together 
          // to allow conjoined requests
          const fieldDataSlice = await this.getSlice(actualOffset, length);
          fieldValues = getValues(
            fieldDataSlice,
            fieldType,
            typeCount,
            actualOffset,
            isArray
          );
        } else {
          // lazy evaluation: store the field information for later retrieval
          deferredFieldValues = async () => {
            const fieldDataSlice = await this.getSlice(actualOffset, length);
            return getValues(
              fieldDataSlice,
              fieldType,
              typeCount,
              actualOffset,
              isArray
            );
          };
        }
      }

      if (fieldValues !== null) {
        actualizedFields.set(fieldTag, fieldValues);
      } else if (deferredFieldValues !== null) {
        deferredFields.set(fieldTag, deferredFieldValues);
      }
    }
    const nextIFDByteOffset = dataSlice.readOffset(
      offset + offsetSize + (entrySize * numDirEntries),
    );

    return new ImageFileDirectory(
      actualizedFields,
      deferredFields,
      nextIFDByteOffset
    );
  }
}

class ImageFileDirectory {
  /**
   * Create an ImageFileDirectory.
   * @param {Map} actualizedFields the file directory, mapping tag names to values
   * @param {Map} deferredFields the deferred fields, mapping tag names to async functions
   * @param {number} nextIFDByteOffset the byte offset to the next IFD
   */
  constructor(actualizedFields, deferredFields, nextIFDByteOffset) {
    this.actualizedFields = actualizedFields;
    this.deferredFields = deferredFields;
    this.deferredFieldsBeingResolved = new Map();
    this.nextIFDByteOffset = nextIFDByteOffset;
  }

  /**
   * @param {number|string} tagIdentifier The field tag ID or name
   * @returns {boolean} whether the field exists (actualized or deferred)
   */
  hasTag(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    return this.actualizedFields.has(tag) || this.deferredFields.has(tag);
  }

  /**
   *
   * @param {number|string} tagIdentifier The field tag ID or name
   * @returns the field value, or undefined if it is deferred or does not exist
   */
  getValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);

    // TODO: throw if the value is deferred
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
