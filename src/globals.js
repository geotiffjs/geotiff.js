export const fieldTypes = {
  BYTE: 0x0001,
  ASCII: 0x0002,
  SHORT: 0x0003,
  LONG: 0x0004,
  RATIONAL: 0x0005,
  SBYTE: 0x0006,
  UNDEFINED: 0x0007,
  SSHORT: 0x0008,
  SLONG: 0x0009,
  SRATIONAL: 0x000a,
  FLOAT: 0x000b,
  DOUBLE: 0x000c,
  // IFD offset, suggested by https://owl.phy.queensu.ca/~phil/exiftool/standards.html
  IFD: 0x000d,
  // introduced by BigTIFF
  LONG8: 0x0010,
  SLONG8: 0x0011,
  IFD8: 0x0012,
};

export const fieldTypeSizes = {
  [fieldTypes.BYTE]: 1,
  [fieldTypes.ASCII]: 1,
  [fieldTypes.SBYTE]: 1,
  [fieldTypes.UNDEFINED]: 1,
  [fieldTypes.SHORT]: 2,
  [fieldTypes.SSHORT]: 2,
  [fieldTypes.LONG]: 4,
  [fieldTypes.SLONG]: 4,
  [fieldTypes.FLOAT]: 4,
  [fieldTypes.IFD]: 4,
  [fieldTypes.RATIONAL]: 8,
  [fieldTypes.SRATIONAL]: 8,
  [fieldTypes.DOUBLE]: 8,
  [fieldTypes.LONG8]: 8,
  [fieldTypes.SLONG8]: 8,
  [fieldTypes.IFD8]: 8,
};

/**
 * Get the byte size for a given field type.
 * @param {number} fieldType The TIFF field type constant
 * @returns {number} The size in bytes
 * @throws {RangeError} If the field type is invalid
 */
export function getFieldTypeSize(fieldType) {
  const size = fieldTypeSizes[fieldType];
  if (size === undefined) {
    throw new RangeError(`Invalid field type: ${fieldType}`);
  }
  return size;
}

const tagSource = [
  { tag: 254, name: 'NewSubfileType', fieldTypes: fieldTypes.LONG },
  { tag: 255, name: 'SubfileType', type: fieldTypes.SHORT },
  { tag: 256, name: 'ImageWidth', type: fieldTypes.SHORT },
  { tag: 257, name: 'ImageLength', type: fieldTypes.SHORT },
  {
    tag: 258,
    name: 'BitsPerSample',
    type: fieldTypes.SHORT,
    isArray: true,
    eager: true,
  },
  { tag: 259, name: 'Compression', type: fieldTypes.SHORT },
  { tag: 262, name: 'PhotometricInterpretation', type: fieldTypes.SHORT },
  { tag: 263, name: 'Threshholding', type: fieldTypes.SHORT },
  { tag: 264, name: 'CellWidth', type: fieldTypes.SHORT },
  { tag: 265, name: 'CellLength', type: fieldTypes.SHORT },
  { tag: 266, name: 'FillOrder', type: fieldTypes.SHORT },
  { tag: 269, name: 'DocumentName', type: fieldTypes.ASCII },
  { tag: 270, name: 'ImageDescription', type: fieldTypes.ASCII },
  { tag: 271, name: 'Make', type: fieldTypes.ASCII },
  { tag: 272, name: 'Model', type: fieldTypes.ASCII },
  { tag: 273, name: 'StripOffsets', type: fieldTypes.SHORT, isArray: true },
  { tag: 274, name: 'Orientation', type: fieldTypes.SHORT },
  { tag: 277, name: 'SamplesPerPixel', type: fieldTypes.SHORT },
  { tag: 278, name: 'RowsPerStrip', type: fieldTypes.SHORT },
  { tag: 279, name: 'StripByteCounts', type: fieldTypes.LONG, isArray: true },
  { tag: 280, name: 'MinSampleValue', type: fieldTypes.SHORT, isArray: true },
  { tag: 281, name: 'MaxSampleValue', type: fieldTypes.SHORT, isArray: true },
  { tag: 282, name: 'XResolution', type: fieldTypes.RATIONAL },
  { tag: 283, name: 'YResolution', type: fieldTypes.RATIONAL },
  { tag: 284, name: 'PlanarConfiguration', fieldTypes: fieldTypes.SHORT },
  { tag: 285, name: 'PageName', type: fieldTypes.ASCII },
  { tag: 286, name: 'XPosition', type: fieldTypes.RATIONAL },
  { tag: 287, name: 'YPosition', type: fieldTypes.RATIONAL },
  { tag: 288, name: 'FreeOffsets', type: fieldTypes.LONG },
  { tag: 289, name: 'FreeByteCounts', type: fieldTypes.LONG },
  { tag: 290, name: 'GrayResponseUnit', type: fieldTypes.SHORT },
  {
    tag: 291,
    name: 'GrayResponseCurve',
    type: fieldTypes.SHORT,
    isArray: true,
  },
  { tag: 292, name: 'T4Options', type: fieldTypes.LONG },
  { tag: 293, name: 'T6Options', type: fieldTypes.LONG },
  { tag: 296, name: 'ResolutionUnit', type: fieldTypes.SHORT },
  { tag: 297, name: 'PageNumber', type: fieldTypes.SHORT, isArray: true },
  { tag: 301, name: 'TransferFunction', type: fieldTypes.SHORT, isArray: true },
  { tag: 305, name: 'Software', type: fieldTypes.ASCII },
  { tag: 306, name: 'DateTime', type: fieldTypes.ASCII },
  { tag: 315, name: 'Artist', type: fieldTypes.ASCII },
  { tag: 316, name: 'HostComputer', type: fieldTypes.ASCII },
  { tag: 317, name: 'Predictor', type: fieldTypes.SHORT },
  { tag: 318, name: 'WhitePoint', type: fieldTypes.RATIONAL, isArray: true },
  {
    tag: 319,
    name: 'PrimaryChromaticities',
    type: fieldTypes.RATIONAL,
    isArray: true,
  },
  { tag: 320, name: 'ColorMap', type: fieldTypes.SHORT, isArray: true },
  { tag: 321, name: 'HalftoneHints', type: fieldTypes.SHORT, isArray: true },
  { tag: 322, name: 'TileWidth', type: fieldTypes.SHORT },
  { tag: 323, name: 'TileLength', type: fieldTypes.SHORT },
  { tag: 324, name: 'TileOffsets', type: fieldTypes.LONG, isArray: true },
  { tag: 325, name: 'TileByteCounts', type: fieldTypes.SHORT, isArray: true },
  { tag: 332, name: 'InkSet', type: fieldTypes.SHORT },
  { tag: 333, name: 'InkNames', type: fieldTypes.ASCII },
  { tag: 334, name: 'NumberOfInks', type: fieldTypes.SHORT },
  { tag: 336, name: 'DotRange', type: fieldTypes.BYTE, isArray: true },
  { tag: 337, name: 'TargetPrinter', type: fieldTypes.ASCII },
  { tag: 338, name: 'ExtraSamples', type: fieldTypes.BYTE, isArray: true },
  {
    tag: 339,
    name: 'SampleFormat',
    type: fieldTypes.SHORT,
    isArray: true,
    eager: true,
  },
  { tag: 340, name: 'SMinSampleValue', type: fieldTypes.Any, isArray: true },
  { tag: 341, name: 'SMaxSampleValue', type: fieldTypes.Any, isArray: true },
  { tag: 342, name: 'TransferRange', type: fieldTypes.SHORT, isArray: true },
  { tag: 512, name: 'JPEGProc', type: fieldTypes.SHORT },
  { tag: 513, name: 'JPEGInterchangeFormat', type: fieldTypes.LONG },
  { tag: 514, name: 'JPEGInterchangeFormatLngth', type: fieldTypes.LONG },
  { tag: 515, name: 'JPEGRestartInterval', type: fieldTypes.SHORT },
  {
    tag: 517,
    name: 'JPEGLosslessPredictors',
    type: fieldTypes.SHORT,
    isArray: true,
  },
  {
    tag: 518,
    name: 'JPEGPointTransforms',
    type: fieldTypes.SHORT,
    isArray: true,
  },
  { tag: 519, name: 'JPEGQTables', type: fieldTypes.LONG, isArray: true },
  { tag: 520, name: 'JPEGDCTables', type: fieldTypes.LONG, isArray: true },
  { tag: 521, name: 'JPEGACTables', type: fieldTypes.LONG, isArray: true },
  {
    tag: 529,
    name: 'YCbCrCoefficients',
    type: fieldTypes.RATIONAL,
    isArray: true,
  },
  { tag: 530, name: 'YCbCrSubSampling', type: fieldTypes.SHORT, isArray: true },
  { tag: 531, name: 'YCbCrPositioning', type: fieldTypes.SHORT },
  {
    tag: 532,
    name: 'ReferenceBlackWhite',
    type: fieldTypes.LONG,
    isArray: true,
  },
  { tag: 33432, name: 'Copyright', type: fieldTypes.ASCII },

  // TIFF Extended
  { tag: 326, name: 'BadFaxLines' },
  { tag: 327, name: 'CleanFaxData' },
  { tag: 343, name: 'ClipPath' },
  { tag: 328, name: 'ConsecutiveBadFaxLines' },
  { tag: 433, name: 'Decode' },
  { tag: 434, name: 'DefaultImageColor' },
  { tag: 346, name: 'Indexed' },
  { tag: 347, name: 'JPEGTables', isArray: true, eager: true },
  { tag: 559, name: 'StripRowCounts', isArray: true },
  { tag: 330, name: 'SubIFDs', isArray: true },
  { tag: 344, name: 'XClipPathUnits' },
  { tag: 345, name: 'YClipPathUnits' },

  // EXIF
  { tag: 37378, name: 'ApertureValue' },
  { tag: 40961, name: 'ColorSpace' },
  { tag: 36868, name: 'DateTimeDigitized' },
  { tag: 36867, name: 'DateTimeOriginal' },
  { tag: 34665, name: 'Exif IFD', type: fieldTypes.LONG },
  { tag: 36864, name: 'ExifVersion' },
  { tag: 33434, name: 'ExposureTime' },
  { tag: 41728, name: 'FileSource' },
  { tag: 37385, name: 'Flash' },
  { tag: 40960, name: 'FlashpixVersion' },
  { tag: 33437, name: 'FNumber' },
  { tag: 42016, name: 'ImageUniqueID' },
  { tag: 37384, name: 'LightSource' },
  { tag: 37500, name: 'MakerNote' },
  { tag: 37377, name: 'ShutterSpeedValue' },
  { tag: 37510, name: 'UserComment' },

  // IPTC
  { tag: 33723, name: 'IPTC' },

  // Laser Scanning Microscopy
  { tag: 34412, name: 'CZ_LSMINFO' },

  // ICC
  { tag: 34675, name: 'ICC Profile' },

  // XMP
  { tag: 700, name: 'XMP' },

  // GDAL
  { tag: 42112, name: 'GDAL_METADATA' },
  { tag: 42113, name: 'GDAL_NODATA', type: fieldTypes.ASCII },

  // Photoshop
  { tag: 34377, name: 'Photoshop' },

  // GeoTiff
  {
    tag: 33550,
    name: 'ModelPixelScale',
    type: fieldTypes.DOUBLE,
    isArray: true,
    eager: true,
  },
  {
    tag: 33922,
    name: 'ModelTiepoint',
    type: fieldTypes.DOUBLE,
    isArray: true,
    eager: true,
  },
  {
    tag: 34264,
    name: 'ModelTransformation',
    type: fieldTypes.DOUBLE,
    isArray: true,
    eager: true,
  },
  {
    tag: 34735,
    name: 'GeoKeyDirectory',
    type: fieldTypes.SHORT,
    isArray: true,
    eager: true,
  },
  {
    tag: 34736,
    name: 'GeoDoubleParams',
    type: fieldTypes.DOUBLE,
    isArray: true,
    eager: true,
  },
  { tag: 34737, name: 'GeoAsciiParams', type: fieldTypes.ASCII, eager: true },

  // LERC
  { tag: 50674, name: 'LercParameters', eager: true },
];

/**
 * Maps tag names to their numeric values
 */
export const tags = {};

/**
 * Maps tag numbers to their definitions
 */
export const tagDefinitions = {};

/**
 * Registers a new field tag
 * @param {number} tag the numeric tiff tag
 * @param {string} name the name of the tag that will be reported in the IFD
 * @param {string|number} type the tags data type
 * @param {Boolean} isArray whether the tag is an array
 */
export function registerTag(
  tag,
  name,
  type = undefined,
  isArray = false,
  eager = false,
) {
  tags[name] = tag;
  tagDefinitions[tag] = { tag, name, type: typeof type === 'string' ? fieldTypes[type] : type, isArray, eager };
}

for (const entry of tagSource) {
  registerTag(entry.tag, entry.name, entry.type, entry.isArray, entry.eager);
}

/**
 * @param {number|string} tagIdentifier The field tag ID or name
 * @returns {number} the resolved tag ID
 */
export function resolveTag(tagIdentifier) {
  if (typeof tagIdentifier === 'number') {
    return tagIdentifier;
  }
  return tags[tagIdentifier];
}

export function getTag(tagIdentifier) {
  return tagDefinitions[resolveTag(tagIdentifier)];
}

export const fieldTagTypes = {
  256: 'SHORT',
  257: 'SHORT',
  258: 'SHORT',
  259: 'SHORT',
  262: 'SHORT',
  270: 'ASCII',
  271: 'ASCII',
  272: 'ASCII',
  273: 'LONG',
  274: 'SHORT',
  277: 'SHORT',
  278: 'LONG',
  279: 'LONG',
  282: 'RATIONAL',
  283: 'RATIONAL',
  284: 'SHORT',
  286: 'SHORT',
  287: 'RATIONAL',
  296: 'SHORT',
  297: 'SHORT',
  305: 'ASCII',
  306: 'ASCII',
  315: 'ASCII',
  338: 'SHORT',
  339: 'SHORT',
  513: 'LONG',
  514: 'LONG',
  1024: 'SHORT',
  1025: 'SHORT',
  1026: 'ASCII',
  2048: 'SHORT',
  2049: 'ASCII',
  2052: 'SHORT',
  2054: 'SHORT',
  2057: 'DOUBLE',
  2059: 'DOUBLE',
  2060: 'SHORT',
  3072: 'SHORT',
  3073: 'ASCII',
  3076: 'SHORT',
  4096: 'SHORT',
  4097: 'ASCII',
  4099: 'SHORT',
  33432: 'ASCII',
  33550: 'DOUBLE',
  33922: 'DOUBLE',
  34264: 'DOUBLE',
  34665: 'LONG',
  34735: 'SHORT',
  34736: 'DOUBLE',
  34737: 'ASCII',
  42113: 'ASCII',
};

export const photometricInterpretations = {
  WhiteIsZero: 0,
  BlackIsZero: 1,
  RGB: 2,
  Palette: 3,
  TransparencyMask: 4,
  CMYK: 5,
  YCbCr: 6,

  CIELab: 8,
  ICCLab: 9,
};

export const ExtraSamplesValues = {
  Unspecified: 0,
  Assocalpha: 1,
  Unassalpha: 2,
};

export const LercParameters = {
  Version: 0,
  AddCompression: 1,
};

export const LercAddCompression = {
  None: 0,
  Deflate: 1,
  Zstandard: 2,
};

export const geoKeyNames = {
  1024: 'GTModelTypeGeoKey',
  1025: 'GTRasterTypeGeoKey',
  1026: 'GTCitationGeoKey',
  2048: 'GeographicTypeGeoKey',
  2049: 'GeogCitationGeoKey',
  2050: 'GeogGeodeticDatumGeoKey',
  2051: 'GeogPrimeMeridianGeoKey',
  2052: 'GeogLinearUnitsGeoKey',
  2053: 'GeogLinearUnitSizeGeoKey',
  2054: 'GeogAngularUnitsGeoKey',
  2055: 'GeogAngularUnitSizeGeoKey',
  2056: 'GeogEllipsoidGeoKey',
  2057: 'GeogSemiMajorAxisGeoKey',
  2058: 'GeogSemiMinorAxisGeoKey',
  2059: 'GeogInvFlatteningGeoKey',
  2060: 'GeogAzimuthUnitsGeoKey',
  2061: 'GeogPrimeMeridianLongGeoKey',
  2062: 'GeogTOWGS84GeoKey',
  3072: 'ProjectedCSTypeGeoKey',
  3073: 'PCSCitationGeoKey',
  3074: 'ProjectionGeoKey',
  3075: 'ProjCoordTransGeoKey',
  3076: 'ProjLinearUnitsGeoKey',
  3077: 'ProjLinearUnitSizeGeoKey',
  3078: 'ProjStdParallel1GeoKey',
  3079: 'ProjStdParallel2GeoKey',
  3080: 'ProjNatOriginLongGeoKey',
  3081: 'ProjNatOriginLatGeoKey',
  3082: 'ProjFalseEastingGeoKey',
  3083: 'ProjFalseNorthingGeoKey',
  3084: 'ProjFalseOriginLongGeoKey',
  3085: 'ProjFalseOriginLatGeoKey',
  3086: 'ProjFalseOriginEastingGeoKey',
  3087: 'ProjFalseOriginNorthingGeoKey',
  3088: 'ProjCenterLongGeoKey',
  3089: 'ProjCenterLatGeoKey',
  3090: 'ProjCenterEastingGeoKey',
  3091: 'ProjCenterNorthingGeoKey',
  3092: 'ProjScaleAtNatOriginGeoKey',
  3093: 'ProjScaleAtCenterGeoKey',
  3094: 'ProjAzimuthAngleGeoKey',
  3095: 'ProjStraightVertPoleLongGeoKey',
  3096: 'ProjRectifiedGridAngleGeoKey',
  4096: 'VerticalCSTypeGeoKey',
  4097: 'VerticalCitationGeoKey',
  4098: 'VerticalDatumGeoKey',
  4099: 'VerticalUnitsGeoKey',
};

export const geoKeys = {};
for (const key in geoKeyNames) {
  if (geoKeyNames.hasOwnProperty(key)) {
    geoKeys[geoKeyNames[key]] = parseInt(key, 10);
  }
}
