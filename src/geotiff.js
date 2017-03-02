"use strict";

var globals = require("./globals.js");
var GeoTIFFImage = require("./geotiffimage.js");
var DataView64 = require("./dataview64.js");

var fieldTypes = globals.fieldTypes,
    fieldTagNames = globals.fieldTagNames,
    arrayFields = globals.arrayFields,
    geoKeyNames = globals.geoKeyNames;

/**
 * The abstraction for a whole GeoTIFF file.
 * @constructor
 * @param {ArrayBuffer} rawData the raw data stream of the file as an ArrayBuffer.
 * @param {Object} [options] further options.
 * @param {Boolean} [options.cache=false] whether or not decoded tiles shall be cached.
 */
function GeoTIFF(rawData, options) {
  this.dataView = new DataView64(rawData);
  options = options || {};
  this.cache = options.cache || false;

  var BOM = this.dataView.getUint16(0, 0);
  if (BOM === 0x4949) {
    this.littleEndian = true;
  }
  else if (BOM === 0x4D4D) {
    this.littleEndian = false;
  }
  else {
    throw new TypeError("Invalid byte order value.");
  }

  var magicNumber = this.dataView.getUint16(2, this.littleEndian);
  if (this.dataView.getUint16(2, this.littleEndian) === 42) {
    this.bigTiff = false;
  }
  else if (magicNumber === 43) {
    this.bigTiff = true;
    var offsetBytesize = this.dataView.getUint16(4, this.littleEndian);
    if (offsetBytesize !== 8) {
      throw new Error("Unsupported offset byte-size.");
    }
  }
  else {
    throw new TypeError("Invalid magic number.");
  }

  this.fileDirectories = this.parseFileDirectories(
    this.getOffset((this.bigTiff) ? 8 : 4)
  );
}

GeoTIFF.prototype = {
  getOffset: function(offset) {
    if (this.bigTiff) {
      return this.dataView.getUint64(offset, this.littleEndian);
    }
    return this.dataView.getUint32(offset, this.littleEndian);
  },

  getFieldTypeLength: function(fieldType) {
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
        throw new RangeError("Invalid field type: " + fieldType);
    }
  },

  getValues: function(fieldType, count, offset) {
    var values = null;
    var readMethod = null;
    var fieldTypeLength = this.getFieldTypeLength(fieldType);
    var i;

    switch (fieldType) {
      case fieldTypes.BYTE: case fieldTypes.ASCII: case fieldTypes.UNDEFINED:
        values = new Uint8Array(count); readMethod = this.dataView.getUint8;
        break;
      case fieldTypes.SBYTE:
        values = new Int8Array(count); readMethod = this.dataView.getInt8;
        break;
      case fieldTypes.SHORT:
        values = new Uint16Array(count); readMethod = this.dataView.getUint16;
        break;
      case fieldTypes.SSHORT:
        values = new Int16Array(count); readMethod = this.dataView.getInt16;
        break;
      case fieldTypes.LONG:
        values = new Uint32Array(count); readMethod = this.dataView.getUint32;
        break;
      case fieldTypes.SLONG:
        values = new Int32Array(count); readMethod = this.dataView.getInt32;
        break;
      case fieldTypes.LONG8: case fieldTypes.IFD8:
        values = new Array(count); readMethod = this.dataView.getUint64;
        break;
      case fieldTypes.SLONG8:
        values = new Array(count); readMethod = this.dataView.getInt64;
        break;
      case fieldTypes.RATIONAL:
        values = new Uint32Array(count*2); readMethod = this.dataView.getUint32;
        break;
      case fieldTypes.SRATIONAL:
        values = new Int32Array(count*2); readMethod = this.dataView.getInt32;
        break;
      case fieldTypes.FLOAT:
        values = new Float32Array(count); readMethod = this.dataView.getFloat32;
        break;
      case fieldTypes.DOUBLE:
        values = new Float64Array(count); readMethod = this.dataView.getFloat64;
        break;
      default:
        throw new RangeError("Invalid field type: " + fieldType);
    }

    // normal fields
    if (!(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
      for (i=0; i < count; ++i) {
        values[i] = readMethod.call(
          this.dataView, offset + (i*fieldTypeLength), this.littleEndian
        );
      }
    }
    // RATIONAL or SRATIONAL
    else {
      for (i=0; i < count; i+=2) {
        values[i] = readMethod.call(
          this.dataView, offset + (i*fieldTypeLength), this.littleEndian
        );
        values[i+1] = readMethod.call(
          this.dataView, offset + (i*fieldTypeLength + 4), this.littleEndian
        );
      }
    }

    if (fieldType === fieldTypes.ASCII) {
      return String.fromCharCode.apply(null, values);
    }
    return values;
  },

  getFieldValues: function(fieldTag, fieldType, typeCount, valueOffset) {
    var fieldValues;
    var fieldTypeLength = this.getFieldTypeLength(fieldType);

    if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
      fieldValues = this.getValues(fieldType, typeCount, valueOffset);
    }
    else {
      var actualOffset = this.getOffset(valueOffset);
      fieldValues = this.getValues(fieldType, typeCount, actualOffset);
    }

    if (typeCount === 1 && arrayFields.indexOf(fieldTag) === -1 && !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
      return fieldValues[0];
    }

    return fieldValues;
  },

  parseGeoKeyDirectory: function(fileDirectory) {
    var rawGeoKeyDirectory = fileDirectory.GeoKeyDirectory;
    if (!rawGeoKeyDirectory) {
      return null;
    }

    var geoKeyDirectory = {};
    for (var i = 4; i < rawGeoKeyDirectory[3] * 4; i += 4) {
      var key = geoKeyNames[rawGeoKeyDirectory[i]],
        location = (rawGeoKeyDirectory[i+1]) ? (fieldTagNames[rawGeoKeyDirectory[i+1]]) : null,
        count = rawGeoKeyDirectory[i+2],
        offset = rawGeoKeyDirectory[i+3];

      var value = null;
      if (!location) {
        value = offset;
      }
      else {
        value = fileDirectory[location];
        if (typeof value === "undefined" || value === null) {
          throw new Error("Could not get value of geoKey '" + key + "'.");
        }
        else if (typeof value === "string") {
          value = value.substring(offset, offset + count - 1);
        }
        else if (value.subarray) {
          value = value.subarray(offset, offset + count - 1);
        }
      }
      geoKeyDirectory[key] = value;
    }
    return geoKeyDirectory;
  },

  parseFileDirectories: function(byteOffset) {
    var nextIFDByteOffset = byteOffset;
    var fileDirectories = [];

    while (nextIFDByteOffset !== 0x00000000) {
      var numDirEntries = this.bigTiff ?
          this.dataView.getUint64(nextIFDByteOffset, this.littleEndian) :
          this.dataView.getUint16(nextIFDByteOffset, this.littleEndian);

      var fileDirectory = {};
      var i = nextIFDByteOffset + (this.bigTiff ? 8 : 2);
      for (var entryCount = 0; entryCount < numDirEntries; i += (this.bigTiff ? 20 : 12), ++entryCount) {
        var fieldTag = this.dataView.getUint16(i, this.littleEndian);
        var fieldType = this.dataView.getUint16(i + 2, this.littleEndian);
        var typeCount = this.bigTiff ?
            this.dataView.getUint64(i + 4, this.littleEndian):
            this.dataView.getUint32(i + 4, this.littleEndian);

        fileDirectory[fieldTagNames[fieldTag]] = this.getFieldValues(
          fieldTag, fieldType, typeCount, i + (this.bigTiff ? 12 : 8)
        );
      }
      fileDirectories.push([
        fileDirectory, this.parseGeoKeyDirectory(fileDirectory)
      ]);

      nextIFDByteOffset = this.getOffset(i);
    }
    return fileDirectories;
  },

  /**
   * Get the n-th internal subfile a an image. By default, the first is returned.
   *
   * @param {Number} [index=0] the index of the image to return.
   * @returns {GeoTIFFImage} the image at the given index
   */
  getImage: function(index) {
    index = index || 0;
    var fileDirectoryAndGeoKey = this.fileDirectories[index];
    if (!fileDirectoryAndGeoKey) {
      throw new RangeError("Invalid image index");
    }
    return new GeoTIFFImage(fileDirectoryAndGeoKey[0], fileDirectoryAndGeoKey[1], this.dataView, this.littleEndian, this.cache);
  },

  /**
   * Returns the count of the internal subfiles.
   *
   * @returns {Number} the number of internal subfile images
   */
  getImageCount: function() {
    return this.fileDirectories.length;
  }
};

module.exports = GeoTIFF;
