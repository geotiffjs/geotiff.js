import { fieldTypes, fieldTagNames, arrayFields, geoKeyNames } from './globals';
import GeoTIFFImage from './geotiffimage';
import DataView64 from './dataview64';
import DataSlice from './dataslice';


function getFieldTypeLength(fieldType) {
  switch (fieldType) {
    case fieldTypes.BYTE: case fieldTypes.ASCII: case fieldTypes.SBYTE: case fieldTypes.UNDEFINED:
      return 1;
    case fieldTypes.SHORT: case fieldTypes.SSHORT:
      return 2;
    case fieldTypes.LONG: case fieldTypes.SLONG: case fieldTypes.FLOAT:
      return 4;
    case fieldTypes.RATIONAL: case fieldTypes.SRATIONAL: case fieldTypes.DOUBLE:
    case fieldTypes.LONG8: case fieldTypes.SLONG8: case fieldTypes.IFD8:
      return 8;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }
}

function parseGeoKeyDirectory(fileDirectory) {
  const rawGeoKeyDirectory = fileDirectory.GeoKeyDirectory;
  if (!rawGeoKeyDirectory) {
    return null;
  }

  const geoKeyDirectory = {};
  for (let i = 4; i < rawGeoKeyDirectory[3] * 4; i += 4) {
    const key = geoKeyNames[rawGeoKeyDirectory[i]];
    const location = (rawGeoKeyDirectory[i + 1]) ?
      (fieldTagNames[rawGeoKeyDirectory[i + 1]]) : null;
    const count = rawGeoKeyDirectory[i + 2];
    const offset = rawGeoKeyDirectory[i + 3];

    let value = null;
    if (!location) {
      value = offset;
    } else {
      value = fileDirectory[location];
      if (typeof value === 'undefined' || value === null) {
        throw new Error(`Could not get value of geoKey '${key}'.`);
      } else if (typeof value === 'string') {
        value = value.substring(offset, offset + count - 1);
      } else if (value.subarray) {
        value = value.subarray(offset, offset + count - 1);
      }
    }
    geoKeyDirectory[key] = value;
  }
  return geoKeyDirectory;
}

function getValues(dataSlice, fieldType, count, offset) {
  let values = null;
  let readMethod = null;
  const fieldTypeLength = getFieldTypeLength(fieldType);

  switch (fieldType) {
    case fieldTypes.BYTE: case fieldTypes.ASCII: case fieldTypes.UNDEFINED:
      values = new Uint8Array(count); readMethod = dataSlice.readUint8;
      break;
    case fieldTypes.SBYTE:
      values = new Int8Array(count); readMethod = dataSlice.readInt8;
      break;
    case fieldTypes.SHORT:
      values = new Uint16Array(count); readMethod = dataSlice.readUint16;
      break;
    case fieldTypes.SSHORT:
      values = new Int16Array(count); readMethod = dataSlice.readInt16;
      break;
    case fieldTypes.LONG:
      values = new Uint32Array(count); readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SLONG:
      values = new Int32Array(count); readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.LONG8: case fieldTypes.IFD8:
      values = new Array(count); readMethod = dataSlice.readUint64;
      break;
    case fieldTypes.SLONG8:
      values = new Array(count); readMethod = dataSlice.readInt64;
      break;
    case fieldTypes.RATIONAL:
      values = new Uint32Array(count * 2); readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SRATIONAL:
      values = new Int32Array(count * 2); readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.FLOAT:
      values = new Float32Array(count); readMethod = dataSlice.readFloat32;
      break;
    case fieldTypes.DOUBLE:
      values = new Float64Array(count); readMethod = dataSlice.readFloat64;
      break;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }

  // normal fields
  if (!(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
    for (let i = 0; i < count; ++i) {
      values[i] = readMethod.call(
        dataSlice, offset + (i * fieldTypeLength),
      );
    }
  } else { // RATIONAL or SRATIONAL
    for (let i = 0; i < count; i += 2) {
      values[i] = readMethod.call(
        dataSlice, offset + (i * fieldTypeLength),
      );
      values[i + 1] = readMethod.call(
        dataSlice, offset + ((i * fieldTypeLength) + 4),
      );
    }
  }

  if (fieldType === fieldTypes.ASCII) {
    return String.fromCharCode.apply(null, values);
  }
  return values;
}

/**
 * The abstraction for a whole GeoTIFF file.
 */
class GeoTIFF {
  /**
   * @constructor
   * @param {ArrayBuffer} rawData the raw data stream of the file as an ArrayBuffer.
   * @param {Object} [options] further options.
   * @param {Boolean} [options.cache=false] whether or not decoded tiles shall be cached.
   */
  constructor(source, littleEndian, bigTiff, firstIFDOffset, options = {}) {
    this.source = source;
    this.littleEndian = littleEndian;
    this.bigTiff = bigTiff;
    this.firstIFDOffset = firstIFDOffset;
    this.cache = options.cache || false;
    this.fileDirectories = null;
    this.fileDirectoriesParsing = null;
  }

  async getSlice(offset, size) {
    return new DataSlice(
      await this.source.fetch(
        offset, size || this.bigTiff ? 4048 : 1024,
      ), offset, this.littleEndian, this.bigTiff,
    );
  }

  async parseFileDirectories() {
    let nextIFDByteOffset = this.firstIFDOffset;
    const offsetSize = this.bigTiff ? 8 : 2;
    const entrySize = this.bigTiff ? 20 : 12;
    const fileDirectories = [];

    let dataSlice = await this.getSlice(nextIFDByteOffset);

    while (nextIFDByteOffset !== 0x00000000) {
      const numDirEntries = this.bigTiff ?
        dataSlice.readUint64(nextIFDByteOffset) :
        dataSlice.readUint16(nextIFDByteOffset);

      // if the slice does not cover the whole IFD, request a bigger slice, where the
      // whole IFD fits: num of entries + n x tag length + offset to next IFD
      const byteSize = (numDirEntries * entrySize) + (this.bigTiff ? 16 : 6);
      if (!dataSlice.covers(nextIFDByteOffset, byteSize)) {
        dataSlice = await this.getSlice(nextIFDByteOffset, byteSize);
      }

      const fileDirectory = {};

      // loop over the IFD and create a file directory object
      let i = nextIFDByteOffset + (this.bigTiff ? 8 : 2);
      for (let entryCount = 0; entryCount < numDirEntries; i += entrySize, ++entryCount) {
        const fieldTag = dataSlice.readUint16(i);
        const fieldType = dataSlice.readUint16(i + 2);
        const typeCount = this.bigTiff ?
          dataSlice.readUint64(i + 4) :
          dataSlice.readUint32(i + 4);

        let fieldValues;
        let value;
        const fieldTypeLength = getFieldTypeLength(fieldType);
        const valueOffset = i + (this.bigTiff ? 12 : 8);

        // check whether the value is directly encoded in the tag or refers to a
        // different external byte range
        if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
          fieldValues = getValues(dataSlice, fieldType, typeCount, valueOffset);
        } else {
          // resolve the reference to the actual byte range
          const actualOffset = dataSlice.readOffset(valueOffset);
          const length = getFieldTypeLength(fieldType) * typeCount;

          // check, whether we actually cover the referenced byte range; if not,
          // request a new slice of bytes to read from it
          if (dataSlice.covers(actualOffset, length)) {
            fieldValues = getValues(dataSlice, fieldType, typeCount, actualOffset);
          } else {
            const fieldDataSlice = await this.getSlice(actualOffset, length);
            fieldValues = getValues(fieldDataSlice, fieldType, typeCount, actualOffset);
          }
        }

        // unpack single values from the array
        if (typeCount === 1 && arrayFields.indexOf(fieldTag) === -1 &&
          !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
          value = fieldValues[0];
        } else {
          value = fieldValues;
        }

        // write the tags value to the file directly
        fileDirectory[fieldTagNames[fieldTag]] = value;
      }

      fileDirectories.push([
        fileDirectory, parseGeoKeyDirectory(fileDirectory),
      ]);

      // continue with the next IFD
      nextIFDByteOffset = dataSlice.readOffset(
        nextIFDByteOffset + offsetSize + (entrySize * numDirEntries),
      );
    }
    return fileDirectories;
  }

  /**
   * Get the n-th internal subfile a an image. By default, the first is returned.
   *
   * @param {Number} [index=0] the index of the image to return.
   * @returns {GeoTIFFImage} the image at the given index
   */
  async getImage(index = 0) {
    if (!this.fileDirectories) {
      if (!this.fileDirectoriesParsing) {
        this.fileDirectoriesParsing = this.parseFileDirectories();
      }
      this.fileDirectories = await this.fileDirectoriesParsing;
    }

    const fileDirectoryAndGeoKey = this.fileDirectories[index];
    if (!fileDirectoryAndGeoKey) {
      throw new RangeError('Invalid image index');
    }
    return new GeoTIFFImage(
      fileDirectoryAndGeoKey[0], fileDirectoryAndGeoKey[1],
      this.dataView, this.littleEndian, this.cache, this.source,
    );
  }

  /**
   * Returns the count of the internal subfiles.
   *
   * @returns {Number} the number of internal subfile images
   */
  async getImageCount() {
    if (!this.fileDirectories) {
      if (!this.fileDirectoriesParsing) {
        this.fileDirectoriesParsing = this.parseFileDirectories();
      }
      this.fileDirectories = await this.fileDirectoriesParsing;
    }

    return this.fileDirectories.length;
  }

  /**
   * Parse a (Geo)TIFF file from the given source.
   * @param {object} source The source of data to parse from.
   * @param {object} options Additional options.
   */
  static async parse(source, options) {
    const headerData = await source.fetch(0, 1024);
    const dataView = new DataView64(headerData);

    const BOM = dataView.getUint16(0, 0);
    let littleEndian;
    if (BOM === 0x4949) {
      littleEndian = true;
    } else if (BOM === 0x4D4D) {
      littleEndian = false;
    } else {
      throw new TypeError('Invalid byte order value.');
    }

    const magicNumber = dataView.getUint16(2, littleEndian);
    let bigTiff;
    if (dataView.getUint16(2, littleEndian) === 42) {
      bigTiff = false;
    } else if (magicNumber === 43) {
      bigTiff = true;
      const offsetBytesize = dataView.getUint16(4, littleEndian);
      if (offsetBytesize !== 8) {
        throw new Error('Unsupported offset byte-size.');
      }
    } else {
      throw new TypeError('Invalid magic number.');
    }

    const firstIFDOffset = bigTiff ?
      dataView.getUint64(8, littleEndian) :
      dataView.getUint32(4, littleEndian);
    return new GeoTIFF(source, littleEndian, bigTiff, firstIFDOffset, options);
  }
}

export default GeoTIFF;
