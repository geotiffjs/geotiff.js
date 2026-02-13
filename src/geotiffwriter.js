/*
  Some parts of this file are based on UTIF.js,
  which was released under the MIT License.
  You can view that here:
  https://github.com/photopea/UTIF.js/blob/master/LICENSE
*/
import { tags, fieldTagTypes, fieldTypes, geoKeyNames } from './globals.js';
import { assign, endsWith, forEach, invert, times, typeMap,
  isTypedUintArray, isTypedIntArray, isTypedFloatArray } from './utils.js';

/** @import {GeotiffWriterMetadata} from './geotiff.js' */

/** @typedef {(buff: Uint8Array, p: number) => number} Read */

const tagName2Code = tags;
const geoKeyName2Code = invert(geoKeyNames);
/** @type {Record<number|string, keyof fieldTagTypes>} */
const name2code = {};
assign(name2code, tagName2Code);
assign(name2code, geoKeyName2Code);
const typeName2byte = fieldTypes;

// config variables
const numBytesInIfd = 1000;

/**
 * @typedef {Object} BinBE
 * @property {(data: Uint8Array, o: number) => number} nextZero
 * @property {Read} readUshort
 * @property {Read} readShort
 * @property {Read} readInt
 * @property {Read} readUint
 * @property {(buff: Uint8Array, p: number, l: Array<number>) => string} readASCII
 * @property {Read} readFloat
 * @property {Read} readDouble
 * @property {(buff: Uint8Array, p: number, n: number) => void} writeUshort
 * @property {(buff: Uint8Array, p: number, n: number) => void} writeUint
 * @property {(buff: Uint8Array, p: number, s: string) => void} writeASCII
 * @property {Uint8Array} ui8
 * @property {Float64Array} fl64
 * @property {Float32Array} fl32
 * @property {Uint32Array} ui32
 * @property {Int32Array} i32
 * @property {Int16Array} i16
 * @property {(buff: Uint8Array, p: number, n: number) => void} writeDouble
 */

const ui8 = new Uint8Array(8);

/** @type {BinBE} */
const _binBE = {
  /** @type {Read} */
  nextZero: (data, o) => {
    let oincr = o;
    while (data[oincr] !== 0) {
      oincr++;
    }
    return oincr;
  },
  /** @type {Read} */
  readUshort: (buff, p) => {
    return (buff[p] << 8) | buff[p + 1];
  },
  /** @type {Read} */
  readShort: (buff, p) => {
    const a = _binBE.ui8;
    a[0] = buff[p + 1];
    a[1] = buff[p + 0];
    return _binBE.i16[0];
  },
  /** @type {Read} */
  readInt: (buff, p) => {
    const a = _binBE.ui8;
    a[0] = buff[p + 3];
    a[1] = buff[p + 2];
    a[2] = buff[p + 1];
    a[3] = buff[p + 0];
    return _binBE.i32[0];
  },
  /** @type {Read} */
  readUint: (buff, p) => {
    const a = _binBE.ui8;
    a[0] = buff[p + 3];
    a[1] = buff[p + 2];
    a[2] = buff[p + 1];
    a[3] = buff[p + 0];
    return _binBE.ui32[0];
  },
  /**
   * @param {Uint8Array} buff
   * @param {number} p
   * @param {Array<number>} l
   * @returns {string}
   */
  readASCII: (buff, p, l) => {
    return l.map((i) => String.fromCharCode(buff[p + i])).join('');
  },
  /** @type {Read} */
  readFloat: (buff, p) => {
    const a = _binBE.ui8;
    times(4, (i) => {
      a[i] = buff[p + 3 - i];
    });
    return _binBE.fl32[0];
  },
  /** @type {Read} */
  readDouble: (buff, p) => {
    const a = _binBE.ui8;
    times(8, (i) => {
      a[i] = buff[p + 7 - i];
    });
    return _binBE.fl64[0];
  },
  /**
   * @param {Uint8Array} buff
   * @param {number} p
   * @param {number} n
   */
  writeUshort: (buff, p, n) => {
    buff[p] = (n >> 8) & 255;
    buff[p + 1] = n & 255;
  },
  /**
   * @param {Uint8Array} buff
   * @param {number} p
   * @param {number} n
   */
  writeUint: (buff, p, n) => {
    buff[p] = (n >> 24) & 255;
    buff[p + 1] = (n >> 16) & 255;
    buff[p + 2] = (n >> 8) & 255;
    buff[p + 3] = (n >> 0) & 255;
  },
  /**
   * @param {Uint8Array} buff
   * @param {number} p
   * @param {string} s
   */
  writeASCII: (buff, p, s) => {
    times(s.length, (i) => {
      buff[p + i] = s.charCodeAt(i);
    });
  },
  ui8,
  fl64: new Float64Array(ui8.buffer),
  fl32: new Float32Array(ui8.buffer),
  ui32: new Uint32Array(ui8.buffer),
  i32: new Int32Array(ui8.buffer),
  i16: new Int16Array(ui8.buffer),
  /**
    * @param {Uint8Array} buff
    * @param {number} p
    * @param {number} n
    */
  writeDouble: (buff, p, n) => {
    _binBE.fl64[0] = n;
    times(8, (i) => {
      buff[p + i] = _binBE.ui8[7 - i];
    });
  },
};

/**
 * @param {BinBE} bin
 * @param {Uint8Array} data
 * @param {number} _offset
 * @param {Record<keyof fieldTagTypes, any>} ifd
 * @returns {[number, number]}
 */
const _writeIFD = (bin, data, _offset, ifd) => {
  let offset = _offset;

  const keys = /** @type {Array<keyof fieldTagTypes>} */ (Object.keys(ifd).filter((key) => {
    return key !== undefined && key !== null && key !== 'undefined';
  }).map(Number));

  bin.writeUshort(data, offset, keys.length);
  offset += 2;

  let eoff = offset + (12 * keys.length) + 4;

  for (const key of keys) {
    const typeName = /** @type {keyof typeName2byte} */ (fieldTagTypes[key]);
    const typeNum = typeName2byte[typeName];

    if (typeName == null || typeName === undefined || typeof typeName === 'undefined') {
      throw new Error(`unknown type of tag: ${key}`);
    }

    let val = ifd[key];

    if (val === undefined) {
      throw new Error(`failed to get value for key ${key}`);
    }

    // ASCIIZ format with trailing 0 character
    // http://www.fileformat.info/format/tiff/corion.htm
    // https://stackoverflow.com/questions/7783044/whats-the-difference-between-asciiz-vs-ascii
    if (typeName === 'ASCII' && typeof val === 'string' && endsWith(val, '\u0000') === false) {
      val += '\u0000';
    }

    const num = val.length;

    bin.writeUshort(data, offset, key);
    offset += 2;

    bin.writeUshort(data, offset, typeNum);
    offset += 2;

    bin.writeUint(data, offset, num);
    offset += 4;

    let dlen = [-1, 1, 1, 2, 4, 8, 0, 0, 0, 0, 0, 0, 8][typeNum] * num;
    let toff = offset;

    if (dlen > 4) {
      bin.writeUint(data, offset, eoff);
      toff = eoff;
    }

    if (typeName === 'ASCII') {
      bin.writeASCII(data, toff, val);
    } else if (typeName === 'SHORT') {
      times(num, (i) => {
        bin.writeUshort(data, toff + (2 * i), val[i]);
      });
    } else if (typeName === 'LONG') {
      times(num, (i) => {
        bin.writeUint(data, toff + (4 * i), val[i]);
      });
    } else if (typeName === 'RATIONAL') {
      times(num, (i) => {
        bin.writeUint(data, toff + (8 * i), Math.round(val[i] * 10000));
        bin.writeUint(data, toff + (8 * i) + 4, 10000);
      });
    } else if (typeName === 'DOUBLE') {
      times(num, (i) => {
        bin.writeDouble(data, toff + (8 * i), val[i]);
      });
    }

    if (dlen > 4) {
      dlen += (dlen & 1);
      eoff += dlen;
    }

    offset += 4;
  }

  return [offset, eoff];
};

/**
 * @param {Array<Record<keyof fieldTagTypes, unknown>>} ifds
 * @returns {ArrayBuffer}
 */
const encodeIfds = (ifds) => {
  const data = new Uint8Array(numBytesInIfd);
  let offset = 4;
  const bin = _binBE;

  // set big-endian byte-order
  // https://en.wikipedia.org/wiki/TIFF#Byte_order
  data[0] = 77;
  data[1] = 77;

  // set format-version number
  // https://en.wikipedia.org/wiki/TIFF#Byte_order
  data[3] = 42;

  let ifdo = 8;

  bin.writeUint(data, offset, ifdo);

  offset += 4;

  ifds.forEach((ifd, i) => {
    const noffs = _writeIFD(bin, data, ifdo, ifd);
    ifdo = noffs[1];
    if (i < ifds.length - 1) {
      bin.writeUint(data, noffs[0], ifdo);
    }
  });

  if (data.slice) {
    return data.slice(0, ifdo).buffer;
  }

  // node hasn't implemented slice on Uint8Array yet
  const result = new Uint8Array(ifdo);
  for (let i = 0; i < ifdo; i++) {
    result[i] = data[i];
  }
  return result.buffer;
};

/**
 * @param {Array<number>|import('./geotiff.js').TypedArray} values
 * @param {number} width
 * @param {number} height
 * @param {GeotiffWriterMetadata} metadata
 * @returns {ArrayBuffer}
 */
const encodeImage = (values, width, height, metadata) => {
  if (height === undefined || height === null) {
    throw new Error(`you passed into encodeImage a width of type ${height}`);
  }

  if (width === undefined || width === null) {
    throw new Error(`you passed into encodeImage a width of type ${width}`);
  }

  /** @type {Record<number|string, Array<number|string>|number|string|undefined>} */
  const ifd = {
    256: [width], // ImageWidth
    257: [height], // ImageLength
    273: [numBytesInIfd], // strips offset
    278: [height], // RowsPerStrip
    305: 'geotiff.js', // no array for ASCII(Z)
  };

  if (metadata) {
    for (const i in metadata) {
      if (metadata.hasOwnProperty(i)) {
        ifd[i] = metadata[/** @type {keyof GeotiffWriterMetadata} */ (i)];
      }
    }
  }

  const prfx = new Uint8Array(encodeIfds([ifd]));
  const samplesPerPixel = /** @type {number} */ (ifd[tags.SamplesPerPixel]);

  const dataType = /** @type {keyof typeMap} */ (values.constructor.name);
  const TypedArray = typeMap[dataType];

  // default for Float64
  let elementSize = 8;
  if (TypedArray) {
    elementSize = TypedArray.BYTES_PER_ELEMENT;
  }

  const data = new Uint8Array(numBytesInIfd + (values.length * elementSize * samplesPerPixel));

  times(prfx.length, (i) => {
    data[i] = prfx[i];
  });

  forEach(values, (value, i) => {
    if (!TypedArray) {
      data[numBytesInIfd + i] = value;
      return;
    }

    const buffer = new ArrayBuffer(elementSize);
    const view = new DataView(buffer);

    if (dataType === 'Float64Array') {
      view.setFloat64(0, value, false);
    } else if (dataType === 'Float32Array') {
      view.setFloat32(0, value, false);
    } else if (dataType === 'Uint32Array') {
      view.setUint32(0, value, false);
    } else if (dataType === 'Uint16Array') {
      view.setUint16(0, value, false);
    } else if (dataType === 'Uint8Array') {
      view.setUint8(0, value);
    }

    const typedArray = new Uint8Array(view.buffer);
    const idx = numBytesInIfd + (i * elementSize);

    for (let j = 0; j < elementSize; j++) {
      data[idx + j] = typedArray[j];
    }
  });

  return data.buffer;
};

/**
 * @template T
 * @param {Record<number|string, T>} input
 * @returns {Record<number|string, T>}
 */
const convertToTids = (input) => {
  /** @type {Record<number|string, T>} */
  const result = {};
  for (const key in input) {
    if (key !== 'StripOffsets') {
      if (!name2code[key]) {
        console.error(key, 'not in name2code:', Object.keys(name2code));
      }
      result[name2code[key]] = input[key];
    }
  }
  return result;
};

/**
 * @template T
 * @param {T} input
 * @returns {T extends any[] ? T : T[]}
 */
const toArray = (input) => {
  if (Array.isArray(input)) {
    return /** @type {T extends any[] ? T : T[]} */ (input);
  }
  return /** @type {T extends any[] ? T : T[]} */ ([input]);
};

/** @type {Partial<GeotiffWriterMetadata>} */
const metadataDefaults = {
  Compression: 1, // no compression
  PlanarConfiguration: 1,
  ExtraSamples: 0,
};

/**
 * @param {Array<number>|Array<Array<Array<number>>>|import('./geotiff.js').TypedArray} data
 * @param {GeotiffWriterMetadata} metadata
 * @returns {ArrayBuffer}
 */
export function writeGeotiff(data, metadata) {
  const isFlattened = typeof data[0] === 'number';

  /** @type {number} */
  let height;
  /** @type {number} */
  let numBands;
  /** @type {number} */
  let width;
  /** @type {Array<number>} */
  let flattenedValues;

  if (isFlattened) {
    const arrayFlat = /** @type {Array<number>} */ (data);
    const metaHeight = metadata.height || metadata.ImageLength;
    if (metaHeight === undefined || typeof metaHeight !== 'number') {
      throw new Error('height is required to be a number in metadata if data is a flat array');
    }
    height = metaHeight;
    const metaWidth = metadata.width || metadata.ImageWidth;
    if (metaWidth === undefined || typeof metaWidth !== 'number') {
      throw new Error('width is required to be a number in metadata if data is a flat array');
    }
    width = metaWidth;
    numBands = arrayFlat.length / (height * width);
    flattenedValues = arrayFlat;
  } else {
    const array3d = /** @type {Array<Array<Array<number>>>} */ (data);
    numBands = array3d.length;
    height = array3d[0].length;
    width = array3d[0][0].length;
    flattenedValues = [];
    times(height, (rowIndex) => {
      times(width, (columnIndex) => {
        times(numBands, (bandIndex) => {
          flattenedValues.push(array3d[bandIndex][rowIndex][columnIndex]);
        });
      });
    });
  }

  metadata.ImageLength = height;
  delete metadata.height;
  metadata.ImageWidth = width;
  delete metadata.width;

  // consult https://www.loc.gov/preservation/digital/formats/content/tiff_tags.shtml

  if (!metadata.BitsPerSample) {
    let bitsPerSample = 8;
    if (ArrayBuffer.isView(flattenedValues)) {
      bitsPerSample = 8 * Object.getPrototypeOf(flattenedValues).BYTES_PER_ELEMENT;
    }
    metadata.BitsPerSample = times(numBands, () => bitsPerSample);
  }

  const finalMetadata = metadata;
  if (!('Compression' in finalMetadata)) {
    finalMetadata.Compression = metadataDefaults.Compression;
  }
  if (!('PlanarConfiguration' in finalMetadata)) {
    finalMetadata.PlanarConfiguration = metadataDefaults.PlanarConfiguration;
  }
  if (!('ExtraSamples' in finalMetadata)) {
    finalMetadata.ExtraSamples = metadataDefaults.ExtraSamples;
  }

  // The color space of the image data.
  // 1=black is zero and 2=RGB.
  if (!finalMetadata.PhotometricInterpretation) {
    if (!Array.isArray(finalMetadata.BitsPerSample)) {
      throw new Error('BitsPerSample must be an array when PhotometricInterpretation is not provided');
    }
    finalMetadata.PhotometricInterpretation = finalMetadata.BitsPerSample.length === 3 ? 2 : 1;
  }

  // The number of components per pixel.
  if (!finalMetadata.SamplesPerPixel) {
    finalMetadata.SamplesPerPixel = [numBands];
  }

  if (!finalMetadata.StripByteCounts) {
    // we are only writing one strip

    // default for Float64
    let elementSize = 8;

    if (ArrayBuffer.isView(flattenedValues)) {
      elementSize = Object.getPrototypeOf(flattenedValues).BYTES_PER_ELEMENT;
    }

    finalMetadata.StripByteCounts = [numBands * elementSize * height * width];
  }

  if (!finalMetadata.ModelPixelScale && !finalMetadata.ModelTransformation) {
    // assumes raster takes up exactly the whole globe
    finalMetadata.ModelPixelScale = [360 / width, 180 / height, 0];
  }

  if (!finalMetadata.SampleFormat) {
    let sampleFormat = 1;
    if (isTypedFloatArray(flattenedValues)) {
      sampleFormat = 3;
    }
    if (isTypedIntArray(flattenedValues)) {
      sampleFormat = 2;
    }
    if (isTypedUintArray(flattenedValues)) {
      sampleFormat = 1;
    }
    finalMetadata.SampleFormat = times(numBands, () => sampleFormat);
  }

  // if didn't pass in projection information, assume the popular 4326 "geographic projection"
  if (!finalMetadata.hasOwnProperty('GeographicTypeGeoKey') && !finalMetadata.hasOwnProperty('ProjectedCSTypeGeoKey')) {
    finalMetadata.GeographicTypeGeoKey = 4326;
    if (!finalMetadata.ModelTransformation) {
      finalMetadata.ModelTiepoint = [0, 0, 0, -180, 90, 0]; // raster fits whole globe
    }
    finalMetadata.GeogCitationGeoKey = 'WGS 84';
    finalMetadata.GTModelTypeGeoKey = 2;
  }

  const geoKeys = Object.keys(finalMetadata)
    .filter((key) => endsWith(key, 'GeoKey'))
    .sort((a, b) => name2code[a] - name2code[b]);

  // If not provided, build GeoKeyDirectory as well as GeoAsciiParamsTag and GeoDoubleParamsTag
  // if GeoAsciiParams/GeoDoubleParams were passed in, we assume offsets are already correct
  // Spec http://geotiff.maptools.org/spec/geotiff2.4.html
  if (!finalMetadata.GeoKeyDirectory) {
    // Only build ASCII / DOUBLE params if not provided
    let geoAsciiParams = finalMetadata.GeoAsciiParams || '';
    if (typeof geoAsciiParams !== 'string') {
      throw new Error('GeoAsciiParams must be a string if provided');
    }
    let currentAsciiOffset = geoAsciiParams.length;
    const geoDoubleParams = finalMetadata.GeoDoubleParams || [];
    if (!Array.isArray(geoDoubleParams)) {
      throw new Error('GeoDoubleParams must be an array if provided');
    }
    let currentDoubleIndex = geoDoubleParams.length;

    // Since geoKeys already sorted and filtered, do a single pass to append to corresponding directory for SHORT/ASCII/DOUBLE
    const GeoKeyDirectory = [1, 1, 0, 0];
    let validKeys = 0;
    geoKeys.forEach((geoKey) => {
      const KeyID = name2code[geoKey];
      const tagType = fieldTagTypes[KeyID];
      const val = finalMetadata[/** @type {keyof import('./geotiff.js').GeotiffWriterMetadata} */ (geoKey)];
      if (val === undefined) {
        return;
      }

      let Count;
      let TIFFTagLocation;
      /** @type {number} */
      let valueOffset;
      if (tagType === 'SHORT') {
        Count = 1;
        TIFFTagLocation = 0;
        if (typeof val !== 'number') {
          throw new Error(`GeoKey ${geoKey} with type SHORT must have a number value`);
        }
        valueOffset = val;
      } else if (tagType === 'ASCII') {
        if (!finalMetadata.GeoAsciiParams) {
          const valStr = `${val.toString()}\u0000`;
          TIFFTagLocation = Number(name2code.GeoAsciiParams); // 34737
          valueOffset = currentAsciiOffset;
          Count = valStr.length;
          geoAsciiParams += valStr;
          currentAsciiOffset += valStr.length;
        } else {
          return;
        }
      } else if (tagType === 'DOUBLE') {
        if (!finalMetadata.GeoDoubleParams) {
          const arr = toArray(val);
          TIFFTagLocation = Number(name2code.GeoDoubleParams); // 34736
          valueOffset = currentDoubleIndex;
          Count = arr.length;
          for (const v of arr) {
            geoDoubleParams.push(Number(v));
            currentDoubleIndex++;
          }
        } else {
          return;
        }
      } else {
        console.warn(`[geotiff.js] couldn't get TIFFTagLocation for ${geoKey}`);
        return;
      }

      GeoKeyDirectory.push(KeyID, TIFFTagLocation, Count, valueOffset);
      validKeys++;
    });

    // Write GeoKeyDirectory, GeoAsciiParams, GeoDoubleParams
    GeoKeyDirectory[3] = validKeys;
    finalMetadata.GeoKeyDirectory = GeoKeyDirectory;
    if (!finalMetadata.GeoAsciiParams && geoAsciiParams.length > 0) {
      finalMetadata.GeoAsciiParams = geoAsciiParams;
    }
    if (!finalMetadata.GeoDoubleParams && geoDoubleParams.length > 0) {
      finalMetadata.GeoDoubleParams = geoDoubleParams;
    }
  }

  // cleanup original GeoKeys metadata, because stored in GeoKeyDirectory tag
  for (const geoKey of geoKeys) {
    if (finalMetadata.hasOwnProperty(geoKey)) {
      delete finalMetadata[/** @type {keyof import('./geotiff.js').GeotiffWriterMetadata} */ (geoKey)];
    }
  }

  /** @type {const} */ ([
    'Compression',
    'ExtraSamples',
    'GeographicTypeGeoKey',
    'GTModelTypeGeoKey',
    'GTRasterTypeGeoKey',
    'ImageLength', // synonym of ImageHeight
    'ImageWidth',
    'Orientation',
    'PhotometricInterpretation',
    'ProjectedCSTypeGeoKey',
    'PlanarConfiguration',
    'ResolutionUnit',
    'SamplesPerPixel',
    'XPosition',
    'YPosition',
    'RowsPerStrip',
  ]).forEach((name) => {
    if (finalMetadata[name]) {
      finalMetadata[name] = toArray(finalMetadata[name]);
    }
  });

  const encodedMetadata = convertToTids(finalMetadata);

  const outputImage = encodeImage(flattenedValues, width, height, encodedMetadata);

  return outputImage;
}
