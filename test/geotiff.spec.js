/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */

import isNode from 'detect-node';
import { expect } from 'chai';
import 'isomorphic-fetch';

import { GeoTIFF, fromArrayBuffer, writeArrayBuffer } from '../src/main';
import { makeFetchSource, makeFileSource } from '../src/source';
import { chunk, toArray, toArrayRecursively, range } from '../src/utils';

function counter(array) {
  return array.reduce((counts, value) => {
    if (counts[value] === undefined) {
      counts[value] = 1;
    } else {
      counts[value]++
    }
    return counts;
  }, {});
}

function createSource(filename) {
  if (isNode) {
    return makeFileSource(`test/data/${filename}`);
  }
  return makeFetchSource(`test/data/${filename}`);
}

async function performNBitTests(tiff, width, height, sampleCount, type, expectedCounts) {
  const image = await tiff.getImage();
  expect(image).to.be.ok;
  expect(image.getWidth()).to.equal(width);
  expect(image.getHeight()).to.equal(height);
  expect(image.getSamplesPerPixel()).to.equal(sampleCount);

  // only sample the first band
  const rasters = await image.readRasters({ samples: [0] });
  const data = rasters[0];
  const actualCounts = counter(data);
  for (let pixelValue in expectedCounts) {
    expect(actualCounts[pixelValue]).to.equal(expectedCounts[pixelValue]);
  }
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
  const data = await image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
  expect(allData).to.have.length(sampleCount);
  expect(allData[0]).to.be.an.instanceof(type);
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
    "GeogCitationGeoKey": "WGS 84"
  };
}

describe('n-bit tests', () => {

  const expectedWidth = 539;
  const expectedHeight = 448;
  const expectedSampleCount = 15;

  it('should parse 1-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('1-bit.tif'));
    const expectedCounts = { 0: 85103, 1: 156369 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);
  });

  it('should parse 2-bit tiffs', async () => {
    let tiff = await GeoTIFF.fromSource(createSource('2-bit.tif'));
    let expectedCounts = { 0: 85103, 3: 156369 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);

    tiff = await GeoTIFF.fromSource(createSource('another-2-bit.tiff'));
    expectedCounts = { 0: 2995411, 1: 678749, 3: 1170288 };
    await performNBitTests(tiff, 2492, 1944, 1, Uint8Array, expectedCounts);
  });

  it('should parse 3-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('3-bit.tif'));
    const expectedCounts = { 0: 85103, 7: 156369 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);
  });

  it('should parse 4-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('4-bit.tif'));
    const expectedCounts = { 0: 85103, 9: 1, 15: 156368 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);
  });

  it('should parse 5-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('5-bit.tif'));
    const expectedCounts = { 0: 85103, 9: 1, 31: 156368 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);
  });

  it('should parse 6-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('6-bit.tif'));
    const expectedCounts = { 0: 85103, 63: 156364 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);
  });

  it('should parse 7-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('7-bit.tif'));
    const expectedCounts = { 0: 85103, 127: 156360 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint8Array, expectedCounts);
  });

  it('should parse 9-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('9-bit.tif'));
    const expectedCounts = { 0: 85103, 511: 156110 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });

  it('should parse 10-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('10-bit.tif'));
    const expectedCounts = { 0: 85103, 1023: 154331 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });

  it('should parse 11-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('11-bit.tif'));
    const expectedCounts = { 0: 85103, 2047: 143532 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });

  it('should parse 12-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('12-bit.tif'));
    const expectedCounts = { 0: 85103, 4095: 115233 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });

  it('should parse 13-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('13-bit.tif'));
    const expectedCounts = { 0: 85103, 8191: 31658 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });

  it('should parse 14-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('14-bit.tif'));
    const expectedCounts = { 0: 85103, 16383: 7832 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });

  it('should parse 15-bit tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('15-bit.tif'));
    const expectedCounts = { 0: 85103, 32767: 2032 };
    await performNBitTests(tiff, expectedWidth, expectedHeight, expectedSampleCount, Uint16Array, expectedCounts);
  });
});

describe('GeoTIFF', () => {
  it('geotiff.js module available', () => {
    expect(GeoTIFF).to.be.ok;
  });

  it('should work on stripped tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
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
  });

  it('should work on packbit compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('packbits.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work with BigTIFFs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('bigtiff.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
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
    await performRGBTest(tiff, options, comparisonRaster, 3);
  });

  it('should work with paletted files', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('rgb_paletted.tiff'));
    await performRGBTest(tiff, options, comparisonRaster, 15);
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

describe("writeTests", function() {


  it("should write pixel values and metadata with sensible defaults", async () => {

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

  });

});
