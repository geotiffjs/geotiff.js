/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */

import isNode from 'detect-node';
import { expect } from 'chai';
import 'isomorphic-fetch';

import { GeoTIFF, fromArrayBuffer, writeArrayBuffer } from '../src/main';
import { makeFetchSource, makeFileSource } from '../src/source';
import { chunk, toArray, toArrayRecursively, range } from '../src/utils';
import histograms from './data/histograms.json';

function max(data) {
  let maxValue = data[0];
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value > maxValue) {
      maxValue = value;
    }
  }
  return maxValue;
}

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

async function testDerivedTiff(nbits, type) {
  const width = 5;
  const height = 5;
  const sampleCount = 15;

  const tiff1 = await GeoTIFF.fromSource(createSource(`${nbits}-bit-stripped.tif`));
  await performNBitTests(tiff1, width, height, sampleCount, type, nbits);

  const tiff2 = await GeoTIFF.fromSource(createSource(`${nbits}-bit-tiled.tif`));
  await performNBitTests(tiff2, width, height, sampleCount, type, nbits);
}

function compareHistograms(actualCounts, expectedCounts) {
  for (let pixelValue in expectedCounts) {
    expect(actualCounts[pixelValue]).to.equal(expectedCounts[pixelValue]);
  }
}

async function performNBitTests(tiff, width, height, sampleCount, type, nbits) {
  try {
    const image = await tiff.getImage();
    expect(image).to.be.ok;
    expect(image.getWidth()).to.equal(width);
    expect(image.getHeight()).to.equal(height);
    expect(image.getSamplesPerPixel()).to.equal(sampleCount);
    const rasters = await image.readRasters();
    rasters.forEach((data, rasterIndex) => {
      const maxValue = max(data);
      expect(maxValue).to.be.below(Math.pow(2, nbits));

      const actualCounts = counter(data);
      const expectedCounts = histograms[nbits][rasterIndex];
      compareHistograms(actualCounts, expectedCounts);
    });
  } catch (error) {
    throw Error(error);
  }
}

async function performTiffTests(filename, width, height, sampleCount, type) {
  const tiff = await GeoTIFF.fromSource(createSource(filename));
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

  allData.forEach((data, rasterIndex) => {
    const actualCounts = counter(data);
    const expectedCounts = histograms[filename][rasterIndex];
    compareHistograms(actualCounts, expectedCounts);
  });
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

  it('should parse 1-bit tiffs', async () => {
    testDerivedTiff(1, Uint8Array);
  });

  it('should parse 2-bit tiffs', async () => {
    testDerivedTiff(2, Uint8Array);
  });

  it('should parse 3-bit tiffs', async () => {
    return testDerivedTiff(3, Uint8Array);
  });

  it('should parse 4-bit tiffs', async () => {
    return testDerivedTiff(4, Uint8Array);
  });

  it('should parse 5-bit tiffs', async () => {
    return testDerivedTiff(5, Uint8Array);
  });

  it('should parse 6-bit tiffs', async () => {
    return testDerivedTiff(6, Uint8Array);
  });

  it('should parse 7-bit tiffs', async () => {
    return testDerivedTiff(7, Uint8Array);
  });

  it('should parse 9-bit tiffs', async () => {
    return testDerivedTiff(9, Uint16Array);
  });

  it('should parse 10-bit tiffs', async () => {
    return testDerivedTiff(10, Uint16Array);
  });

  it('should parse 11-bit tiffs', async () => {
    return testDerivedTiff(11, Uint16Array);
  });

  it('should parse 12-bit tiffs', async () => {
    return testDerivedTiff(12, Uint16Array);
  });

  it('should parse 13-bit tiffs', async () => {
    return testDerivedTiff(13, Uint16Array);
  });

  it('should parse 14-bit tiffs', async () => {
    return testDerivedTiff(14, Uint16Array);
  });

  it('should parse 15-bit tiffs', async () => {
    return testDerivedTiff(15, Uint16Array);
  });

  it('should parse 16-bit tiffs', async () => {
    return testDerivedTiff(16, Uint16Array);
  });

  it('should parse 17-bit tiffs', async () => {
    return testDerivedTiff(17, Uint32Array);
  });

  it('should parse 18-bit tiffs', async () => {
    return testDerivedTiff(18, Uint32Array);
  });

  it('should parse 19-bit tiffs', async () => {
    return testDerivedTiff(19, Uint32Array);
  });

  it('should parse 20-bit tiffs', async () => {
    return testDerivedTiff(20, Uint32Array);
  });

  it('should parse 21-bit tiffs', async () => {
    return testDerivedTiff(21, Uint32Array);
  });

  it('should parse 22-bit tiffs', async () => {
    return testDerivedTiff(22, Uint32Array);
  });

  it('should parse 23-bit tiffs', async () => {
    return testDerivedTiff(23, Uint32Array);
  });

  it('should parse 24-bit tiffs', async () => {
    return testDerivedTiff(24, Uint32Array);
  });

  it('should parse 25-bit tiffs', async () => {
    return testDerivedTiff(25, Uint32Array);
  });

  it('should parse 26-bit tiffs', async () => {
    return testDerivedTiff(26, Uint32Array);
  });

  it('should parse 27-bit tiffs', async () => {
    return testDerivedTiff(27, Uint32Array);
  });
  it('should parse 28-bit tiffs', async () => {
    return testDerivedTiff(28, Uint32Array);
  });

  it('should parse 29-bit tiffs', async () => {
    return testDerivedTiff(29, Uint32Array);
  });

  it('should parse 30-bit tiffs', async () => {
    return testDerivedTiff(30, Uint32Array);
  });

  it('should parse 31-bit tiffs', async () => {
    return testDerivedTiff(31, Uint32Array);
  });

  it('should parse 32-bit tiffs', async () => {
    return testDerivedTiff(32, Uint32Array);
  });

});


describe('GeoTIFF', () => {

  it('geotiff.js module available', () => {
    expect(GeoTIFF).to.be.ok;
  });

  it('should work on stripped tiffs', async () => {
    await performTiffTests('stripped.tiff', 539, 448, 15, Uint16Array);
  });

  it('should work on tiled tiffs', async () => {
    await performTiffTests('tiled.tiff', 539, 448, 15, Uint16Array);
  });


  it('should work on band interleaved tiffs', async () => {
    await performTiffTests('interleave.tiff', 539, 448, 15, Uint16Array);
  });

  // TODO: currently only the interleave.tiff is used, make own
  it('should work on band interleaved tiled tiffs', async () => {
    await performTiffTests('interleave.tiff', 539, 448, 15, Uint16Array);
  });

  it('should work on LZW compressed images', async () => {
    await performTiffTests('lzw.tiff', 539, 448, 15, Uint16Array);
  });

  it('should work on band interleaved, lzw compressed, and tiled tiffs', async () => {
    await performTiffTests('tiledplanarlzw.tiff', 539, 448, 15, Uint16Array);
  });

  it('should work on Int32 tiffs', async () => {
    await performTiffTests('int32.tiff', 539, 448, 15, Int32Array);
  });

  it('should work on UInt32 tiffs', async () => {
    await performTiffTests('uint32.tiff', 539, 448, 15, Uint32Array);
  });

  it('should work on Float32 tiffs', async () => {
    await performTiffTests('float32.tiff', 539, 448, 15, Float32Array);
  });

  it('should work on Float64 tiffs', async () => {
    await performTiffTests('float64.tiff', 539, 448, 15, Float64Array);
  });

  it('should work on Float64 and lzw compressed tiffs', async () => {
    await performTiffTests('float64lzw.tiff', 539, 448, 15, Float64Array);
  });

  it('should work on packbit compressed tiffs', async () => {
    await performTiffTests('packbits.tiff', 539, 448, 15, Uint16Array);
  });

  it('should work with BigTIFFs', async () => {
    await performTiffTests('bigtiff.tiff', 539, 448, 15, Uint16Array);
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
