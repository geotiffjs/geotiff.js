import isNode from 'detect-node';
import { expect } from 'chai';

import { GeoTIFF, fromArrayBuffer, writeArrayBuffer, Pool } from '../src/geotiff';
import { makeFetchSource, makeFileSource } from '../src/source';
import { chunk, toArray, toArrayRecursively, range } from '../src/utils';
import DataSlice from '../src/dataslice';

function createSource(filename) {
  if (isNode) {
    return makeFileSource(`test/data/${filename}`);
  }
  return makeFetchSource(`test/data/${filename}`);
}

async function performTiffTests(tiff, width, height, sampleCount, type) {
  const image = await tiff.getImage();
  expect(image).to.be.ok;
  expect(image.getWidth()).to.equal(width);
  expect(image.getHeight()).to.equal(height);
  expect(image.getSamplesPerPixel()).to.equal(sampleCount);
  expect(image.getGeoKeys().GeographicTypeGeoKey).to.equal(4326);
  expect(image.getGeoKeys().GeogAngularUnitsGeoKey).to.equal(9102);

  const allData = await image.readRasters({ window: [200, 200, 210, 210] });
  const brData = await image.readRasters({ window: [width - 10, height - 10, width, height] });
  const data = await image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
  expect(allData).to.have.length(sampleCount);
  expect(allData[0]).to.be.an.instanceof(type);
  expect(brData).to.have.length(sampleCount);
  expect(brData[0]).to.be.an.instanceof(type);
  expect(data[0]).to.deep.equal(allData[5]);
}

async function performRGBTest(tiff, options, comparisonRaster, maxDiff) {
  const image = await tiff.getImage();
  const rgbRaster = await image.readRGB(options);
  const comp = await comparisonRaster;

  expect(rgbRaster).to.have.lengthOf(comp.length);
  const diff = new Float32Array(rgbRaster);
  for (let i = 0; i < rgbRaster.length; ++i) {
    diff[i] = Math.abs(comp[i] - rgbRaster[i]);
  }
  expect(Math.max.apply(null, diff)).to.be.at.most(maxDiff);
}

function normalize(input) {
  return JSON.stringify(toArrayRecursively(input));
}

function getMockMetaData(height, width) {
  return {
    "ImageWidth": width, // only necessary if values aren't multi-dimensional
    "ImageLength": height, // only necessary if values aren't multi-dimensional
    "BitsPerSample": [8],
    "Compression": 1, //no compression
    "PhotometricInterpretation": 2,
    "StripOffsets": [1054],
    "SamplesPerPixel": 1,
    "RowsPerStrip": [height],
    "StripByteCounts": [width * height],
    "PlanarConfiguration": 1,
    "SampleFormat": [1],
    "ModelPixelScale": [0.031355, 0.031355, 0],
    "ModelTiepoint": [0, 0, 0, 11.331755000000001, 46.268645, 0],
    "GeoKeyDirectory": [1, 1, 0, 5, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2049, 34737, 7, 0, 2054, 0, 1, 9102],
    "GeoAsciiParams": "WGS 84",
    "GTModelTypeGeoKey": 2,
    "GTRasterTypeGeoKey": 1,
    "GeographicTypeGeoKey": 4326,
    "GeogCitationGeoKey": "WGS 84",
    "GDAL_NODATA": "0",
  };
}

describe('GeoTIFF', () => {
  it('geotiff.js module available', () => {
    expect(GeoTIFF).to.be.ok;
  });

  it('should work on stripped tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should close the GeoTIFF without errors', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
    expect(await tiff.close()).to.be.undefined;
  });

  it('should work on tiled tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('tiled.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on band interleaved tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('interleave.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  // TODO: currently only the interleave.tiff is used, make own
  it('should work on band interleaved tiled tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('interleave.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on LZW compressed images', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lzw.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on deflate compressed images', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('deflate.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on deflate compressed images with predictor', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('deflate_predictor.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on deflate compressed images with predictor and big strips', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('deflate_predictor_big_strips.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on tiled deflate compressed images with predictor', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('deflate_predictor_tiled.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on band interleaved, lzw compressed, and tiled tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('tiledplanarlzw.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on Int32 tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('int32.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Int32Array);
  });

  it('should work on UInt32 tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('uint32.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint32Array);
  });

  it('should work on Float32 tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float32.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float32Array);
  });

  it('should work on Float64 tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float64.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float64Array);
  });

  it('should work on Float64 and lzw compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float64lzw.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float64Array);
  }).timeout(4000);

  it('should work on packbit compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('packbits.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work with BigTIFFs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('bigtiff.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work with NASAs LZW compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('nasa_raster.tiff'));
    const image = await tiff.getImage();
    await image.readRasters();
  });

  // FIXME: does not work with mocha
  // it('should work with worker pool', async () => {
  //   const pool = new Pool()
  //   const tiff = await GeoTIFF.fromSource(createSource('nasa_raster.tiff'));
  //   const image = await tiff.getImage();
  //   await image.readRasters({ pool });
  // });

  it('should work with LZW compressed tiffs that have an EOI Code after a CLEAR code', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lzw_clear_eoi/lzw.tiff'));
    const image = await tiff.getImage();
    await image.readRasters();
  });
});

describe('RGB-tests', () => {
  const options = { window: [250, 250, 300, 300], interleave: true };
  const comparisonRaster = (async () => {
    const tiff = await GeoTIFF.fromSource(createSource('rgb.tiff'));
    const image = await tiff.getImage();
    return image.readRasters(options);
  })();

  // TODO: disabled, as in CI environment such images are not similar enough
  // it('should work with CMYK files', async () => {
  //   const tiff = await GeoTIFF.fromSource(createSource('cmyk.tif'));
  //   await performRGBTest(tiff, options, comparisonRaster, 1);
  // });

  it('should work with YCbCr files', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('ycbcr.tif'));
    await performRGBTest(tiff, options, comparisonRaster, 27);
  });

  it('should work with paletted files', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('rgb_paletted.tiff'));
    await performRGBTest(tiff, options, comparisonRaster, 15);
  });
});

describe('RGBA-tests', () => {
  const options = { window: [250, 250, 300, 300], interleave: true };
  const comparisonRaster = (async () => {
    const tiff = await GeoTIFF.fromSource(createSource('RGBA.tiff'));
    const image = await tiff.getImage();
    return image.readRasters(options);
  })();
  options.enableAlpha = true;
  // TODO: disabled, as in CI environment such images are not similar enough
  // it('should work with CMYK files', async () => {
  //   const tiff = await GeoTIFF.fromSource(createSource('cmyk.tif'));
  //   await performRGBTest(tiff, options, comparisonRaster, 1);
  // });

  it('should work with RGBA files', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('RGBA.tiff'));
    await performRGBTest(tiff, options, comparisonRaster, 3);
  });
});

describe('Geo metadata tests', async () => {
  it('should be able to get the origin and offset of images using tie points and scale', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    const image = await tiff.getImage();
    expect(image.getResolution()).to.be.an('array');
    expect(image.getOrigin()).to.be.an('array');
    expect(image.getBoundingBox()).to.be.an('array');
  });

  it('should be able to get the origin and offset of images using model transformation', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    const image = await tiff.getImage();
    expect(image.getResolution()).to.be.an('array');
    expect(image.getOrigin()).to.be.an('array');
    expect(image.getBoundingBox()).to.be.an('array');
    expect(image.getGeoKeys()).to.have.property('GeographicTypeGeoKey');
    expect(image.getGeoKeys().GeographicTypeGeoKey).to.equal(4326);
  });
});

describe('COG tests', async () => {
  it('should parse the header ghost area when present', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('cog.tiff'));
    const ghostValues = await tiff.getGhostValues();
    expect(ghostValues).to.deep.equal({
      GDAL_STRUCTURAL_METADATA_SIZE: '000140 bytes',
      LAYOUT: 'IFDS_BEFORE_DATA',
      BLOCK_ORDER: 'ROW_MAJOR',
      BLOCK_LEADER: 'SIZE_AS_UINT4',
      BLOCK_TRAILER: 'LAST_4_BYTES_REPEATED',
      KNOWN_INCOMPATIBLE_EDITION: 'NO',
    });
  });

  it('should return null, when no ghost area is present', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('initial.tiff'));
    const ghostValues = await tiff.getGhostValues();
    expect(ghostValues).to.be.null;
  });
});

describe('dataSlice 64 bit tests', () => {
  const littleEndianBytes = new Uint8Array([
    // (2 ** 53 - 1)
    // left
    0xff,
    0xff,
    0xff,
    0xff,
    // right
    0xff,
    0xff,
    0x1f,
    0x00,
    // 2 ** 64 - 1
    // left
    0xff,
    0xff,
    0xff,
    0xff,
    // right
    0xff,
    0xff,
    0xff,
    0xff,
  ]);
  const littleEndianSlice = new DataSlice(littleEndianBytes.buffer, 0, true, true);
  const bigEndianBytes = new Uint8Array([
    // (2 ** 53 - 1)
    // left
    0x00,
    0x1f,
    0xff,
    0xff,
    // right
    0xff,
    0xff,
    0xff,
    0xff,
    // 2 ** 64 - 1
    // left
    0xff,
    0xff,
    0xff,
    0xff,
    // right
    0xff,
    0xff,
    0xff,
    0xff,
  ]);
  const bigEndianSlice = new DataSlice(bigEndianBytes.buffer, 0, false, true);
  it('should read offset for normal int', () => {
    const readLittleEndianBytes = littleEndianSlice.readOffset(0);
    const readBigEndianBytes = bigEndianSlice.readOffset(0);
    expect(readLittleEndianBytes).to.equal(2 ** 53 - 1);
    expect(readBigEndianBytes).to.equal(2 ** 53 - 1);
  });
  it('should throw error for number larger than MAX_SAFE_INTEGER', () => {
    expect(() => {
      littleEndianSlice.readOffset(8);
    }).to.throw();
    expect(() => {
      bigEndianSlice.readOffset(8);
    }).to.throw();
  });
});

describe('writeTests', () => {
  it('should write pixel values and metadata with sensible defaults', async () => {
    const originalValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const metadata = {
      height: 3,
      width: 3
    };
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    expect(JSON.stringify(newValues.slice(0,-1))).to.equal(JSON.stringify(originalValues.slice(0,-1)));
    
    const geoKeys = image.getGeoKeys();
    expect(geoKeys).to.be.an("object");
    expect(geoKeys.GTModelTypeGeoKey).to.equal(2);
    expect(geoKeys.GTRasterTypeGeoKey).to.equal(1);
    expect(geoKeys.GeographicTypeGeoKey).to.equal(4326);
    expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');

    const fileDirectory = newGeoTiff.fileDirectories[0][0];
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal("WGS 84\u0000");
    expect(fileDirectory.ImageLength).to.equal(3);
    expect(fileDirectory.ImageWidth).to.equal(3);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(1);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal("[1000]"); //hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(1);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(3));
    expect(normalize(fileDirectory.StripByteCounts)).to.equal(normalize(metadata.StripByteCounts));
  });

  it("should write rgb data with sensible defaults", async () => {
    const originalRed = [
      [ 255, 255, 255 ],
      [ 0, 0, 0 ],
      [ 0, 0, 0 ]
    ];
    const originalGreen = [
      [ 0, 0, 0 ],
      [ 255, 255, 255 ],
      [ 0, 0, 0 ]
    ];
    const originalBlue = [
      [ 0, 0, 0 ],
      [ 0, 0, 0 ],
      [ 255, 255, 255 ]
    ];
    const originalValues = [originalRed, originalGreen, originalBlue];
    const metadata = {
      height: 3,
      width: 3
    };

    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const newValues = await image.readRasters();
    const red = chunk(newValues[0], 3);
    const green = chunk(newValues[1], 3);
    const blue = chunk(newValues[2], 3);
    expect(normalize(red)).to.equal(normalize(originalRed));
    expect(normalize(green)).to.equal(normalize(originalGreen));
    expect(normalize(blue)).to.equal(normalize(originalBlue));

    const geoKeys = image.getGeoKeys();
    expect(geoKeys).to.be.an("object");
    expect(geoKeys.GTModelTypeGeoKey).to.equal(2);
    expect(geoKeys.GTRasterTypeGeoKey).to.equal(1);
    expect(geoKeys.GeographicTypeGeoKey).to.equal(4326);
    expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');

    const fileDirectory = newGeoTiff.fileDirectories[0][0];
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8,8,8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal("WGS 84\u0000");
    expect(fileDirectory.ImageLength).to.equal(3);
    expect(fileDirectory.ImageWidth).to.equal(3);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(2);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal("[1000]"); //hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1, 1, 1 ]));
    expect(fileDirectory.SamplesPerPixel).to.equal(3);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(3));
    expect(toArray(fileDirectory.StripByteCounts).toString()).to.equal("27");
  });

  it("should write flattened pixel values", async () => {
    const originalValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const height = 3;
    const width = 3;

    const metadata = getMockMetaData(height, width);
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    expect(JSON.stringify(newValues.slice(0,-1))).to.equal(JSON.stringify(originalValues.slice(0,-1)));
  });

  it("should write pixel values in two dimensions", async () => {
    const originalValues = [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]
    ];
    const height = 3;
    const width = 3;

    const metadata = getMockMetaData(height, width);
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const newValues = await image.readRasters();
    const newValuesReshaped = toArray(newValues).map(function(band) {
      return chunk(band, width);
    });
    expect(JSON.stringify(newValuesReshaped.slice(0,-1))).to.equal(JSON.stringify(originalValues.slice(0,-1)));
  });


  it("should write metadata correctly", async () => {
    const height = 12;
    const width = 12;
    const originalValues = range(height * width);
    
    const metadata = getMockMetaData(height, width);
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    expect(JSON.stringify(newValues.slice(0,-1))).to.equal(JSON.stringify(originalValues.slice(0,-1)));

    const fileDirectory = newGeoTiff.fileDirectories[0][0];
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal("WGS 84\u0000");
    expect(fileDirectory.ImageLength).to.equal(height);
    expect(fileDirectory.ImageWidth).to.equal(width);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(2);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal("[1000]"); //hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(1);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(height));
    expect(normalize(fileDirectory.StripByteCounts)).to.equal(normalize(metadata.StripByteCounts));
    expect(fileDirectory.GDAL_NODATA).to.equal("0\u0000");
  });
});
