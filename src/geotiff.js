var globals = require("./globals.js"),
  fieldTags = globals.fieldTags,
  fieldTagNames = globals.fieldTagNames,
  arrayFields = globals.arrayFields,
  fieldTypes = globals.fieldTypes,
  fieldTypeNames = globals.fieldTypeNames,
  GeoTIFFImage = require("./geotiffimage.js");


var GeoTIFF = function(rawData) {
  this.dataView = new DataView(rawData);

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

  if (this.dataView.getUint16(2, this.littleEndian) !== 42) {
    throw new TypeError("Invalid magic number.");
  }

  this.fileDirectories = this.parseFileDirectories(
    this.dataView.getUint32(4, this.littleEndian)
  );
};

GeoTIFF.prototype = {
  getFieldTypeLength: function (fieldType) {
    switch (fieldType) {
      case fieldTypes.BYTE: case fieldTypes.ASCII: case fieldTypes.SBYTE: case fieldTypes.UNDEFINED:
        return 1;
      case fieldTypes.SHORT: case fieldTypes.SSHORT:
        return 2;
      case fieldTypes.LONG: case fieldTypes.SLONG: case fieldTypes.FLOAT:
        return 4;
      case fieldTypes.RATIONAL: case fieldTypes.SRATIONAL: case fieldTypes.DOUBLE:
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
      for (i=0; i < (count*2); i+=2) {
        values[i] = readMethod.call(
          this.dataView, offset + (i*fieldTypeLength), this.littleEndian
        );
        values[i+1] = readMethod.call(
          this.dataView, offset + ((i+1)*fieldTypeLength), this.littleEndian
        );
      }
    }

    if (fieldType === fieldTypes.ASCII) {
      return String.fromCharCode.apply(null, values);
    }
    return values;
  },

  getFieldValues: function (fieldTag, fieldType, typeCount, valueOffset) {
    var fieldValues;
    var fieldTypeLength = this.getFieldTypeLength(fieldType);

    if (fieldTypeLength * typeCount <= 4) {
      fieldValues = this.getValues(fieldType, typeCount, valueOffset);
    }
    else {
      var actualOffset = this.dataView.getUint32(valueOffset, this.littleEndian);
      fieldValues = this.getValues(fieldType, typeCount, actualOffset);
    }

    if (typeCount === 1 && arrayFields.indexOf(fieldTag) === -1 && !(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
      return fieldValues[0];
    }

    return fieldValues;
  },

  parseFileDirectories: function (byteOffset) {
    var nextIFDByteOffset = byteOffset;
    var fileDirectories = [];

    while (nextIFDByteOffset !== 0x00000000) {
      var numDirEntries = this.dataView.getUint16(nextIFDByteOffset, this.littleEndian);
      var fileDirectory = {};

      for (var i = byteOffset + 2, entryCount = 0; entryCount < numDirEntries; i += 12, ++entryCount) {
        var fieldTag = this.dataView.getUint16(i, this.littleEndian);
        var fieldType = this.dataView.getUint16(i + 2, this.littleEndian);
        var typeCount = this.dataView.getUint32(i + 4, this.littleEndian);

        fileDirectory[fieldTagNames[fieldTag]] = this.getFieldValues(
          fieldTag, fieldType, typeCount, i + 8
        );
      }
      fileDirectories.push(fileDirectory);

      nextIFDByteOffset = this.dataView.getUint32(i, this.littleEndian);
    }
    return fileDirectories;
  },

  getImage: function(index) {
    var fileDirectory = this.fileDirectories[index];
    if (!fileDirectory) {
      throw new RangeError("Invalid image index");
    }
    return new GeoTIFFImage(fileDirectory, this.dataView, this.littleEndian);
  },
};

module.exports = GeoTIFF;
