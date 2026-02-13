import DataSlice from './dataslice.js';

import {
  fieldTypes,
  geoKeyNames,
  tagDefinitions,
  resolveTag,
  getFieldTypeSize,
} from './globals.js';

/**
 * Allocates an appropriate TypedArray based on the TIFF field type.
 * @param {number} fieldType - TIFF field type constant from fieldTypes
 * @param {number} count - Number of elements to allocate
 * @returns {import('./geotiff.js').TypedArray|Array<number>} The allocated typed array for the given field type
 * @throws {RangeError} If the field type is invalid
 */
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

/**
 * Returns the appropriate DataSlice read method for a given field type.
 * @param {DataSlice} dataSlice - The DataSlice instance to get the reader from
 * @param {number} fieldType - TIFF field type constant from fieldTypes
 * @returns {Function} The bound read method (e.g., readUint16, readFloat32)
 * @throws {RangeError} If the field type is invalid
 */
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

/**
 * @overload
 * @param {import('./geotiff.js').TypedArray|Array<number>|null} outValues - Optional pre-allocated output array
 * @param {Function} readMethod - DataView read method (e.g., getUint16)
 * @param {DataSlice} dataSlice - Source data slice
 * @param {number} fieldType - TIFF field type constant
 * @param {number} count - Number of values to read
 * @param {number} offset - Byte offset to start reading
 * @param {true} isArray - Whether to always return an array (vs single value)
 * @returns {import('./geotiff.js').TypedArray|Array<number>} The decoded value(s)
 */

/**
 * @overload
 * @param {import('./geotiff.js').TypedArray|Array<number>|null} outValues - Optional pre-allocated output array
 * @param {Function} readMethod - DataView read method (e.g., getUint16)
 * @param {DataSlice} dataSlice - Source data slice
 * @param {number} fieldType - TIFF field type constant
 * @param {number} count - Number of values to read
 * @param {number} offset - Byte offset to start reading
 * @param {boolean} [isArray] - Whether to always return an array (vs single value)
 * @returns {import('./geotiff.js').TypedArray|Array<number>|string|number} The decoded value(s)
 */

/**
 * Reads field values from a DataSlice.
 * @param {import('./geotiff.js').TypedArray|Array<number>|null} outValues - Optional pre-allocated output array
 * @param {Function} readMethod - DataView read method (e.g., getUint16)
 * @param {DataSlice} dataSlice - Source data slice
 * @param {import('./globals.js').FieldType} fieldType - TIFF field type constant
 * @param {number} count - Number of values to read
 * @param {number} offset - Byte offset to start reading
 * @param {boolean} [isArray] - Whether to always return an array (vs single value)
 * @returns {import('./geotiff.js').TypedArray|Array<number>|string|number} The decoded value(s)
 */
function getValues(outValues = null, readMethod, dataSlice, fieldType, count, offset, isArray = false) {
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
    return new TextDecoder('utf-8').decode(/** @type {Uint8Array} */ (values));
  }

  if (count === 1 && !isArray && !isRational) {
    return values[0];
  }
  return values;
}

/**
 * Lazily-loaded array for large TIFF field values that are fetched on-demand.
 * Supports loading individual indices or the entire array. Uses a bitmap to track
 * which values have been loaded to avoid redundant fetches.
 */
class DeferredArray {
  /**
   * Creates a DeferredArray for lazy-loading of large TIFF field arrays.
   * @param {import("./source/basesource.js").BaseSource} source - Data source for fetching
   * @param {number} arrayOffset - Byte offset where the array data starts
   * @param {boolean} littleEndian - Endianness of the data
   * @param {import('./globals.js').FieldType} fieldType - TIFF field type constant
   * @param {number} length - Number of elements in the array
   */
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

  /**
   * Loads all values in the deferred array at once.
   * Subsequent calls return the same promise to avoid redundant fetches.
   * @returns {Promise<import('./geotiff.js').TypedArray|Array<number>>} Promise resolving to the fully loaded array
   */
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
        const result = getValues(
          this.data,
          getDataSliceReader(dataSlice, this.fieldType),
          dataSlice,
          this.fieldType,
          this.length,
          this.arrayOffset,
          true,
        );

        // Mark all items as loaded in the bitmap
        this.maskBitmap.fill(0xFF);

        // Clean up any pending individual fetch promises since all data is now loaded
        this.fetchIndexPromises.clear();

        return result;
      });
    }
    return this.fullFetchPromise;
  }

  /**
   * Loads and returns a single value at the specified index.
   * If the value is already loaded, returns it immediately. Otherwise, fetches it
   * from the source. Multiple calls for the same index reuse the same promise.
   * @param {number} index - Zero-based index of the value to load
   * @returns {Promise<number|bigint>} Promise resolving to the value at the given index
   * @throws {RangeError} If index is out of bounds
   */
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
   * @param {Map<string|number, number|string|Array<number|string>>} actualizedFields the file directory,
   * mapping tag names to values
   * @param {Map<string|number, Function>} deferredFields the deferred fields, mapping tag names to async functions
   * @param {Map<string|number, DeferredArray>} deferredArrays the deferred arrays, mapping tag names to
   * DeferredArray objects
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
   * @template {import('./globals.js').TagName} [T=any]
   * @param {T|number} tagIdentifier The field tag ID or name
   * @returns {this is { getValue(t: T): NonNullable<import('./globals.js').TagValue<T>> }
   *   & import('./imagefiledirectory').ImageFileDirectory} whether the field exists (actualized or deferred)
   */
  hasTag(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    return this.actualizedFields.has(tag) || this.deferredFields.has(tag) || this.deferredArrays.has(tag);
  }

  /**
   * Synchronously retrieves the value for a given tag. If it is deferred, an error is thrown.
   * @template {import('./globals.js').TagName} [T=any]
   * @param {T|number} tagIdentifier The field tag ID or name
   * @returns {T extends import('./globals.js').TagName ? (import('./globals.js').TagValue<T> | undefined) : unknown}
   * the field value,
   * or undefined if it does not exist
   * @throws {Error} If the tag is deferred and requires asynchronous loading
   */
  getValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);

    if (this.deferredFields.has(tag) || this.deferredArrays.has(tag)) {
      const tagDef = tagDefinitions[tag];
      const tagName = tagDef?.name || `Tag${tag}`;
      throw new Error(
        `Field '${tagName}' (${tag}) is deferred. Use loadValue() to load it asynchronously.`,
      );
    }

    if (!this.actualizedFields.has(tag)) {
      return /** @type {any} */ (undefined);
    }

    return /** @type {any} */ (this.actualizedFields.get(tag));
  }

  /**
   * Retrieves the value for a given tag. If it is deferred, it will be loaded first.
   * @template {import('./globals.js').TagName} [T=any]
   * @param {T|number} tagIdentifier The field tag ID or name
   * @returns {Promise<T extends import('./globals.js').TagName ? (import('./globals.js').TagValue<T> | undefined) : any>}
   *   the field value, or undefined if it does not exist
   */
  async loadValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    if (this.actualizedFields.has(tag)) {
      return /** @type {any} */ (this.actualizedFields.get(tag));
    }
    if (this.deferredFieldsBeingResolved.has(tag)) {
      return /** @type {any} */ (this.deferredFieldsBeingResolved.get(tag));
    }
    const loaderFn = this.deferredFields.get(tag);
    if (loaderFn) {
      this.deferredFields.delete(tag);

      // Set promise BEFORE starting async work to prevent race conditions
      const valuePromise = (async () => {
        try {
          const value = await loaderFn();
          this.actualizedFields.set(tag, value);
          return value;
        } finally {
          this.deferredFieldsBeingResolved.delete(tag);
        }
      })();

      this.deferredFieldsBeingResolved.set(tag, valuePromise);
      return /** @type {any} */ (valuePromise);
    }

    const deferredArray = this.deferredArrays.get(tag);
    if (deferredArray) {
      return /** @type {any} */ (deferredArray.loadAll());
    }

    return /** @type {any} */ (undefined);
  }

  /**
   * Retrieves the value at a given index for a tag that is an array. If it is deferred, it will be loaded first.
   * @param {number|string} tagIdentifier The field tag ID or name
   * @param {number} index The index within the array
   * @returns {Promise<number|string|bigint|undefined>} the field value at the given index, or undefined if it does not exist
   */
  async loadValueIndexed(tagIdentifier, index) {
    const tag = resolveTag(tagIdentifier);
    if (this.actualizedFields.has(tag)) {
      const value = this.actualizedFields.get(tag);
      return /** @type {any} */ (value)[index];
    } else if (this.deferredArrays.has(tag)) {
      const deferredArray = /** @type {DeferredArray} */ (this.deferredArrays.get(tag));
      return deferredArray.get(index);
    } else if (this.hasTag(tag)) {
      const value = await this.loadValue(tag);
      if (value && typeof value !== 'number') {
        return value[index];
      }
    }
    return undefined;
  }

  /**
   * Parses the GeoTIFF GeoKeyDirectory tag into a structured object.
   * The GeoKeyDirectory is a special TIFF tag that contains geographic metadata
   * in a key-value format as defined by the GeoTIFF specification.
   * @returns {Partial<Record<import('./globals.js').GeoKeyName, *>>|null} Parsed geo key directory
   *     mapping key names to values, or null if not present
   * @throws {Error} If a referenced geo key value cannot be retrieved
   */
  parseGeoKeyDirectory() {
    const rawGeoKeyDirectory = this.getValue('GeoKeyDirectory');
    if (!rawGeoKeyDirectory) {
      return null;
    }

    /** @type {Partial<Record<import('./globals.js').GeoKeyName, *>>} */
    const geoKeyDirectory = {};
    for (let i = 4; i <= rawGeoKeyDirectory[3] * 4; i += 4) {
      const key = (/** @type {Record<number, import('./globals.js').GeoKeyName>} */ (geoKeyNames))[rawGeoKeyDirectory[i]];
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
    /** @type {Record<string, unknown>} */
    const obj = {};
    for (const [tag, value] of this.actualizedFields.entries()) {
      const tagDefinition = typeof tag === 'number' ? tagDefinitions[tag] : undefined;
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
   * @param {boolean} [eager=false] whether to eagerly fetch deferred fields.
   *                                 When false (default), tags are loaded lazily on-demand.
   *                                 When true, all tags are loaded immediately during parsing.
   */
  constructor(source, littleEndian, bigTiff, eager = false) {
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
      const fieldType = /** @type {import('./globals.js').FieldType} */ (dataSlice.readUint16(i + 2));
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
