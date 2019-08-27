/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */


function createSource(filename) {
  return geotiff.fromUrl(`data/${filename}`);
}

async function performTiffTests(tiff, width, height, sampleCount, type) {
  const image = await tiff.getImage();
  chai.expect(image).to.be.ok;
  chai.expect(image.getWidth()).to.equal(width);
  chai.expect(image.getHeight()).to.equal(height);
  chai.expect(image.getSamplesPerPixel()).to.equal(sampleCount);
  chai.expect(image.getGeoKeys().GeographicTypeGeoKey).to.equal(4326);
  chai.expect(image.getGeoKeys().GeogAngularUnitsGeoKey).to.equal(9102);

  const allData = await image.readRasters({ window: [200, 200, 210, 210] });
  const data = await image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
  chai.expect(allData).to.have.length(sampleCount);
  chai.expect(allData[0]).to.be.an.instanceof(type);
  chai.expect(data[0]).to.deep.equal(allData[5]);
}

async function performRGBTest(tiff, options, comparisonRaster, maxDiff) {
  const image = await tiff.getImage();
  const rgbRaster = await image.readRGB(options);
  const comp = await comparisonRaster;

  chai.expect(rgbRaster).to.have.lengthOf(comp.length);
  const diff = new Float32Array(rgbRaster);
  for (let i = 0; i < rgbRaster.length; ++i) {
    diff[i] = Math.abs(comp[i] - rgbRaster[i]);
  }
  chai.expect(Math.max.apply(null, diff)).to.be.at.most(maxDiff);
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
    chai.expect(geotiff).to.be.ok;
  });

  it('should work on stripped tiffs', async () => {
    const tiff = await createSource('stripped.tiff');
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

//   it('should work on tiled tiffs', async () => {
//     const tiff = await fromFile('tiled.tiff');
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });

//   it('should work on band interleaved tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('interleave.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });

//   // TODO: currently only the interleave.tiff is used, make own
//   it('should work on band interleaved tiled tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('interleave.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });

//   it('should work on LZW compressed images', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('lzw.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });

//   it('should work on band interleaved, lzw compressed, and tiled tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('tiledplanarlzw.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });

//   it('should work on Int32 tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('int32.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Int32Array);
//   });

//   it('should work on UInt32 tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('uint32.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint32Array);
//   });

//   it('should work on Float32 tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('float32.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Float32Array);
//   });

//   it('should work on Float64 tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('float64.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Float64Array);
//   });

//   it('should work on Float64 and lzw compressed tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('float64lzw.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Float64Array);
//   });

//   it('should work on packbit compressed tiffs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('packbits.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });

//   it('should work with BigTIFFs', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('bigtiff.tiff'));
//     await performTiffTests(tiff, 539, 448, 15, Uint16Array);
//   });
// });

// describe('RGB-tests', () => {
//   const options = { window: [250, 250, 300, 300], interleave: true };
//   const comparisonRaster = (async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('rgb.tiff'));
//     const image = await tiff.getImage();
//     return image.readRasters(options);
//   })();

//   // TODO: disabled, as in CI environment such images are not similar enough
//   // it('should work with CMYK files', async () => {
//   //   const tiff = await GeoTIFF.fromSource(createSource('cmyk.tif'));
//   //   await performRGBTest(tiff, options, comparisonRaster, 1);
//   // });

//   it('should work with YCbCr files', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('ycbcr.tif'));
//     await performRGBTest(tiff, options, comparisonRaster, 3);
//   });

//   it('should work with paletted files', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('rgb_paletted.tiff'));
//     await performRGBTest(tiff, options, comparisonRaster, 15);
//   });
// });

// describe('Geo metadata tests', async () => {
//   it('should be able to get the origin and offset of images using tie points and scale', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
//     const image = await tiff.getImage();
//     expect(image.getResolution()).to.be.an('array');
//     expect(image.getOrigin()).to.be.an('array');
//     expect(image.getBoundingBox()).to.be.an('array');
//   });

//   it('should be able to get the origin and offset of images using model transformation', async () => {
//     const tiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
//     const image = await tiff.getImage();
//     expect(image.getResolution()).to.be.an('array');
//     expect(image.getOrigin()).to.be.an('array');
//     expect(image.getBoundingBox()).to.be.an('array');
//     expect(image.getGeoKeys()).to.have.property('GeographicTypeGeoKey');
//     expect(image.getGeoKeys().GeographicTypeGeoKey).to.equal(4326);
//   });

});
