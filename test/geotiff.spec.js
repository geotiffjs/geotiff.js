/* eslint-disable no-unused-expressions */
import isNode from 'detect-node';
import { expect } from 'chai';
import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import AbortController from 'node-abort-controller';
import { dirname } from 'path';

import { GeoTIFF, fromArrayBuffer, writeArrayBuffer, fromUrls, Pool } from '../dist-module/geotiff.js';
import { makeFetchSource } from '../dist-module/source/remote.js';
import { makeFileSource } from '../dist-module/source/file.js';
import { BlockedSource } from '../dist-module/source/blockedsource.js';
import { chunk, toArray, toArrayRecursively, range } from '../dist-module/utils.js';
import DataSlice from '../dist-module/dataslice.js';
import DataView64 from '../dist-module/dataview64.js';

const __dirname = dirname(new URL(import.meta.url).pathname);

// Set up a node server to make tiffs available at localhost:3000/test/data, and a worker pool
let server = null;
let pool = null;
before(async () => {
  const serve = serveStatic(__dirname);
  server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });
  server.listen(3000);
  pool = new Pool();
});

after(async () => {
  server.close();
  pool.destroy();
});

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
    ImageWidth: width, // only necessary if values aren't multi-dimensional
    ImageLength: height, // only necessary if values aren't multi-dimensional
    BitsPerSample: [8],
    Compression: 1, // no compression
    PhotometricInterpretation: 2,
    StripOffsets: [1054],
    SamplesPerPixel: 1,
    RowsPerStrip: [height],
    StripByteCounts: [width * height],
    PlanarConfiguration: 1,
    SampleFormat: [1],
    ModelPixelScale: [0.031355, 0.031355, 0],
    ModelTiepoint: [0, 0, 0, 11.331755000000001, 46.268645, 0],
    GeoKeyDirectory: [1, 1, 0, 5, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2049, 34737, 7, 0, 2054, 0, 1, 9102],
    GeoAsciiParams: 'WGS 84',
    GTModelTypeGeoKey: 2,
    GTRasterTypeGeoKey: 1,
    GeographicTypeGeoKey: 4326,
    GeogCitationGeoKey: 'WGS 84',
    GDAL_NODATA: '0',
  };
}

describe('GeoTIFF - external overviews', () => {
  it('Can load', async () => {
    const tiff = await fromUrls(
      'http://localhost:3000/data/overviews_external.tiff',
      ['http://localhost:3000/data/overviews_external.tiff.ovr'],
    );
    const count = await tiff.getImageCount();
    expect(count).to.equal(5);

    const image1 = await tiff.getImage(0);
    expect(image1.fileDirectory.ImageWidth).to.equal(539);
    const image2 = await tiff.getImage(1);
    expect(image2.fileDirectory.ImageWidth).to.equal(270);
    const image3 = await tiff.getImage(2);
    expect(image3.fileDirectory.ImageWidth).to.equal(135);
    const image4 = await tiff.getImage(3);
    expect(image4.fileDirectory.ImageWidth).to.equal(68);
    const image5 = await tiff.getImage(4);
    expect(image5.fileDirectory.ImageWidth).to.equal(34);
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

  it('should work on LERC compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lerc.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on band interleaved LERC compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lerc_interleave.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on LERC deflate compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lerc_deflate.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on LERC Zstandard compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lerc_zstd.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Uint16Array);
  });

  it('should work on Float32 and LERC compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float32lerc.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float32Array);
  });

  it('should work on Float32 and band interleaved LERC compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float32lerc_interleave.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float32Array);
  });

  it('should work on Float32 and LERC deflate compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float32lerc_deflate.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float32Array);
  });

  it('should work on Float32 and LERC Zstandard compressed tiffs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('float32lerc_zstd.tiff'));
    await performTiffTests(tiff, 539, 448, 15, Float32Array);
  });

  it('should work with worker pool', async () => {
    const testPool = new Pool();
    const tiff = await GeoTIFF.fromSource(createSource('nasa_raster.tiff'));
    const image = await tiff.getImage();
    await image.readRasters({ pool: testPool });
    testPool.destroy();
  });

  it('should work with LZW compressed tiffs that have an EOI Code after a CLEAR code', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('lzw_clear_eoi/lzw.tiff'));
    const image = await tiff.getImage();
    await image.readRasters();
  });
});

describe('n-bit uint tests', () => {
  const wnd = [100, 100, 150, 150];
  for (const n of [10, 11, 12, 13, 14, 15]) {
    it(`should correctly read ${n}-bit datasets pixel interleaved`, async () => {
      const truncValue = (1 << n) - 1;

      const origTiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
      const origData = await (await origTiff.getImage()).readRasters({ window: wnd, samples: [0] });

      const testTiff = await GeoTIFF.fromSource(createSource(`n_bit_${n}.tiff`));
      const testImage = await testTiff.getImage();
      const testData = await testImage.readRasters({ window: wnd, samples: [0] });

      expect(testImage.getBitsPerSample()).to.equal(n);

      for (let s = 0; s < origData.length; ++s) {
        const origSample = origData[s];
        const testSample = testData[s];
        for (let i = 0; i < origSample.length; ++i) {
          expect(testSample[i]).to.equal(Math.min(origSample[i], truncValue));
        }
      }
    });

    it(`should correctly read ${n}-bit datasets band interleaved`, async () => {
      const truncValue = (1 << n) - 1;

      const origTiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
      const origData = await (await origTiff.getImage()).readRasters({ window: wnd, samples: [0] });

      const testTiff = await GeoTIFF.fromSource(createSource(`n_bit_interleave_${n}.tiff`));
      const testImage = await testTiff.getImage();
      const testData = await testImage.readRasters({ window: wnd, samples: [0] });

      expect(testImage.getBitsPerSample()).to.equal(n);

      for (let s = 0; s < origData.length; ++s) {
        const origSample = origData[s];
        const testSample = testData[s];
        for (let i = 0; i < origSample.length; ++i) {
          expect(testSample[i]).to.equal(Math.min(origSample[i], truncValue));
        }
      }
    });

    it(`should correctly read ${n}-bit tiled datasets`, async () => {
      const truncValue = (1 << n) - 1;

      const origTiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
      const origData = await (await origTiff.getImage()).readRasters({ window: wnd, samples: [0] });

      const testTiff = await GeoTIFF.fromSource(createSource(`n_bit_tiled_${n}.tiff`));
      const testImage = await testTiff.getImage();
      const testData = await testImage.readRasters({ window: wnd, samples: [0] });

      expect(testImage.getBitsPerSample()).to.equal(n);

      for (let s = 0; s < origData.length; ++s) {
        const origSample = origData[s];
        const testSample = testData[s];
        for (let i = 0; i < origSample.length; ++i) {
          expect(testSample[i]).to.equal(Math.min(origSample[i], truncValue));
        }
      }
    });
  }

  it('should correctly read 16-bit float pixel interleaved datasets', async () => {
    const origTiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    const origData = await (await origTiff.getImage()).readRasters({ window: wnd, samples: [0] });

    const testTiff = await GeoTIFF.fromSource(createSource('float_n_bit_16.tiff'));
    const testImage = await testTiff.getImage();
    const testData = await testImage.readRasters({ window: wnd, samples: [0] });

    expect(testImage.getBitsPerSample()).to.equal(16);

    for (let s = 0; s < origData.length; ++s) {
      const origSample = origData[s];
      const testSample = testData[s];
      for (let i = 0; i < origSample.length; ++i) {
        expect(Math.abs(testSample[i] - origSample[i])).to.be.lessThan(100);
      }
    }
  });

  it('should correctly read 16-bit float band interleaved datasets', async () => {
    const origTiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    const origData = await (await origTiff.getImage()).readRasters({ window: wnd, samples: [0] });

    const testTiff = await GeoTIFF.fromSource(createSource('float_n_bit_interleave_16.tiff'));
    const testImage = await testTiff.getImage();
    const testData = await testImage.readRasters({ window: wnd, samples: [0] });

    expect(testImage.getBitsPerSample()).to.equal(16);

    for (let s = 0; s < origData.length; ++s) {
      const origSample = origData[s];
      const testSample = testData[s];
      for (let i = 0; i < origSample.length; ++i) {
        expect(Math.abs(testSample[i] - origSample[i])).to.be.lessThan(100);
      }
    }
  });

  it('should correctly read 16-bit float band tiled datasets', async () => {
    const origTiff = await GeoTIFF.fromSource(createSource('stripped.tiff'));
    const origData = await (await origTiff.getImage()).readRasters({ window: wnd, samples: [0] });

    const testTiff = await GeoTIFF.fromSource(createSource('float_n_bit_tiled_16.tiff'));
    const testImage = await testTiff.getImage();
    const testData = await testImage.readRasters({ window: wnd, samples: [0] });

    expect(testImage.getBitsPerSample()).to.equal(16);

    for (let s = 0; s < origData.length; ++s) {
      const origSample = origData[s];
      const testSample = testData[s];
      for (let i = 0; i < origSample.length; ++i) {
        expect(Math.abs(testSample[i] - origSample[i])).to.be.lessThan(100);
      }
    }
  });
});

describe('ifdRequestTests', () => {
  const offsets = [8, 2712, 4394];
  const source = 'multi-channel.ome.tif';

  it('requesting first image only parses first IFD', async () => {
    const tiff = await GeoTIFF.fromSource(createSource(source));
    await tiff.getImage(0);
    expect(tiff.ifdRequests.length).to.equal(1);
  });

  it('requesting last image only parses all IFDs', async () => {
    const tiff = await GeoTIFF.fromSource(createSource(source));
    await tiff.getImage(2);
    // the image has 3 panes, so 2 is the index of the third image
    expect(tiff.ifdRequests.length).to.equal(3);
  });

  it('requesting third image after manually parsing second yiels 2 ifdRequests', async () => {
    const tiff = await GeoTIFF.fromSource(createSource(source));
    const index = 1;
    tiff.ifdRequests[index] = tiff.parseFileDirectoryAt(offsets[index]);
    await tiff.getImage(index + 1);
    // first image slot is empty so we filter out the Promises, of which there are two
    expect(
      tiff.ifdRequests.filter((ifdRequest) => ifdRequest instanceof Promise).length,
    ).to.equal(2);
  });

  it('should be able to manually set ifdRequests and readRasters', async () => {
    const tiff = await GeoTIFF.fromSource(createSource(source));
    tiff.ifdRequests = offsets.map((offset) => tiff.parseFileDirectoryAt(offset));
    tiff.ifdRequests.forEach(async (_, i) => {
      const image = await tiff.getImage(i);
      image.readRasters();
    });
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

  it('should read into non-interleaved arrays if requested', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('rgb.tiff'));
    const image = await tiff.getImage();
    const data = await image.readRGB({ ...options, interleave: false });
    expect(data).to.have.lengthOf(3);
    expect(data[0]).to.have.lengthOf(50 * 50);
    expect(data[1]).to.have.lengthOf(50 * 50);
    expect(data[2]).to.have.lengthOf(50 * 50);
  });
});

describe('Abort signal', () => {
  const source = 'multi-channel.ome.tif';

  it('Abort signal on readRasters throws exception', async () => {
    const tiff = await GeoTIFF.fromSource(createSource(source));
    const image = await tiff.getImage(0);
    const abortController = new AbortController();
    const { signal } = abortController;
    abortController.abort();
    try {
      await image.readRasters({ signal });
    } catch (e) {
      expect(e.name).to.equal('AbortError');
    }
  });
  it('Abort signal on readRGB returns fill value array', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('rgb_paletted.tiff'));
    const image = await tiff.getImage();
    const abortController = new AbortController();
    const { signal } = abortController;
    abortController.abort();
    try {
      await image.readRGB({ signal });
    } catch (e) {
      expect(e.name).to.equal('AbortError');
    }
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

  it('should be able to get the bounding box of skewed images', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('umbra_mount_yasur.tiff'));
    const image = await tiff.getImage();
    expect(image.getBoundingBox()).to.be.an('array');
    expect(image.getBoundingBox()).to.be.deep.equal([336494.9320674397, 7839364.913043569, 337934.4836350695, 7840804.464611199]);
  });
});

describe('GDAL_METADATA tests', async () => {
  it('should parse stats for specific sample', async () => {
    const tiff = await GeoTIFF.fromSource(
      createSource('abetow-ERD2018-EBIRD_SCIENCE-20191109-a5cf4cb2_hr_2018_abundance_median.tiff'),
    );
    const image = await tiff.getImage();
    const metadata = await image.getGDALMetadata(10);
    expect(metadata).to.deep.equal({
      STATISTICS_MAXIMUM: '7.2544522285461',
      STATISTICS_MEAN: 'nan',
      STATISTICS_MINIMUM: '0',
      STATISTICS_STDDEV: 'nan',
    });
  });

  it('should parse stats for single-band GeoTIFF', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('nt_20201024_f18_nrt_s.tif'));
    const image = await tiff.getImage();
    expect(await image.getGDALMetadata(), {}); // no top-level-stats
    expect(await image.getGDALMetadata(0)).to.deep.equal({
      STATISTICS_MAXIMUM: '100',
      STATISTICS_MEAN: '28.560288669249',
      STATISTICS_MINIMUM: '0',
      STATISTICS_STDDEV: '39.349526064368',
    });
  });

  it('should parse layer type', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('eu_pasture.tiff'));
    const image = await tiff.getImage();
    const metadata = await image.getGDALMetadata(0);
    expect(metadata).to.deep.equal({
      LAYER_TYPE: 'athematic',
    });
  });

  it('should parse color interpretation', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('utm.tif'));
    const image = await tiff.getImage();
    const metadata = await image.getGDALMetadata(0);
    expect(metadata).to.deep.equal({
      COLORINTERP: 'Palette',
    });
  });

  it('should parse stats for another single-band GeoTIFF', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('vestfold.tif'));
    const image = await tiff.getImage();
    const metadata = await image.getGDALMetadata(0);
    expect(metadata).to.deep.equal({
      STATISTICS_MAXIMUM: '332.6073328654',
      STATISTICS_MEAN: '83.638959236148',
      STATISTICS_MINIMUM: '18.103807449341',
      STATISTICS_STDDEV: '69.590554367352',
    });
  });

  it('should parse creation times', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('wind_direction.tif'));
    const image = await tiff.getImage();
    const metadata = await image.getGDALMetadata(0);
    expect(metadata).to.deep.equal({
      creationTime: '1497289465',
      creationTimeString: '2017-06-12T17:44:25.466257Z',
      name: 'Wind_Dir_SFC',
    });
  });

  it('should parse top-level metadata when no sample is specified', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('wind_direction.tif'));
    const image = await tiff.getImage();
    const metadata = await image.getGDALMetadata();
    expect(metadata).to.deep.equal({
      DATUM: 'WGS84',
    });
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

describe('fillValue', async () => {
  it('should fill pixels outside the image area (to the left and above)', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('cog.tiff'));
    const image = await tiff.getImage(0);
    const data = await image.readRasters({ window: [-1, -1, 0, 0], fillValue: 42 });
    expect(data).to.have.lengthOf(15);
    for (const band of data) {
      expect(band).to.have.lengthOf(1);
      expect(band).to.deep.equal(new Uint16Array([42]));
    }
  });

  it('should fill pixels outside the image area (to the right and below)', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('cog.tiff'));
    const image = await tiff.getImage(0);
    const data = await image.readRasters({ window: [512, 512, 513, 513], fillValue: 42 });
    expect(data).to.have.lengthOf(15);
    for (const band of data) {
      expect(band).to.have.lengthOf(1);
      expect(band).to.deep.equal(new Uint16Array([42]));
    }
  });

  it('should fill areas in overview tiles outside the image extent (left, with worker pool)', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('cog.tiff'));
    const image = await tiff.getImage(1);
    const data = await image.readRasters({ window: [269, 0, 270, 1], fillValue: 42, pool });
    expect(data).to.have.lengthOf(15);
    for (const band of data) {
      expect(band).to.have.lengthOf(1);
      expect(band).to.deep.equal(new Uint16Array([42]));
    }
  }).timeout(10000);

  it('should fill areas in overview tiles outside the image extent (below, with worker pool)', async () => {
    const tiff = await GeoTIFF.fromSource(createSource('cog.tiff'));
    const image = await tiff.getImage(1);
    const data = await image.readRasters({ window: [0, 224, 1, 225], fillValue: 42, pool });
    expect(data).to.have.lengthOf(15);
    for (const band of data) {
      expect(band).to.have.lengthOf(1);
      expect(band).to.deep.equal(new Uint16Array([42]));
    }
  }).timeout(10000);
});

describe('64 bit tests', () => {
  it('DataView64 uint64 tests', () => {
    const littleEndianBytes = new Uint8Array([
      // ((2 ** 53) - 1)
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
    const littleEndianView = new DataView64(littleEndianBytes.buffer);
    const bigEndianBytes = new Uint8Array([
      // ((2 ** 53) - 1)
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
    const bigEndianView = new DataView64(bigEndianBytes.buffer);
    const readLittleEndianBytes = littleEndianView.getUint64(0, true);
    const readBigEndianBytes = bigEndianView.getUint64(0, false);
    expect(readLittleEndianBytes).to.equal((2 ** 53) - 1);
    expect(readBigEndianBytes).to.equal((2 ** 53) - 1);
    expect(() => {
      littleEndianView.getUint64(8, true);
    }).to.throw();
    expect(() => {
      bigEndianView.getUint64(8, false);
    }).to.throw();
  });

  it('DataView64 negative int64 tests', () => {
    const littleEndianBytes = new Uint8Array([
      // -(2 ** 32 - 1)
      // left
      0x01,
      0x00,
      0x00,
      0x00,
      // right
      0x00,
      0x00,
      0xf0,
      0xff,
    ]);
    const littleEndianView = new DataView64(littleEndianBytes.buffer);
    const bigEndianBytes = new Uint8Array([
      // -(2 ** 32 - 1)
      // left
      0xff,
      0xf0,
      0x00,
      0x00,
      // right
      0x00,
      0x00,
      0x00,
      0x01,
    ]);
    const bigEndianView = new DataView64(bigEndianBytes.buffer);
    const readLittleEndianBytes = littleEndianView.getInt64(0, true);
    const readBigEndianBytes = bigEndianView.getInt64(0, false);
    expect(readLittleEndianBytes).to.equal(-((2 ** 52) - 1));
    expect(readBigEndianBytes).to.equal(-((2 ** 52) - 1));
  });

  it('DataView64 positive int64 tests', () => {
    const littleEndianBytes = new Uint8Array([
      // ((2 ** 52) - 1)
      // left
      0xff,
      0xff,
      0xff,
      0xff,
      // right
      0xff,
      0xff,
      0x0f,
      0x00,
    ]);
    const littleEndianView = new DataView64(littleEndianBytes.buffer);
    const bigEndianBytes = new Uint8Array([
      // ((2 ** 52) - 1)
      // left
      0x00,
      0x0f,
      0xff,
      0xff,
      // right
      0xff,
      0xff,
      0xff,
      0xff,
    ]);
    const bigEndianView = new DataView64(bigEndianBytes.buffer);
    const readLittleEndianBytes = littleEndianView.getInt64(0, true);
    const readBigEndianBytes = bigEndianView.getInt64(0, false);
    expect(readLittleEndianBytes).to.equal((2 ** 52) - 1);
    expect(readBigEndianBytes).to.equal((2 ** 52) - 1);
  });

  it('DataSlice positive int64 tests', () => {
    const littleEndianBytes = new Uint8Array([
      // ((2 ** 52) - 1)
      // left
      0xff,
      0xff,
      0xff,
      0xff,
      // right
      0xff,
      0xff,
      0x0f,
      0x00,
    ]);
    const littleEndianSlice = new DataSlice(
      littleEndianBytes.buffer,
      0,
      true,
      true,
    );
    const bigEndianBytes = new Uint8Array([
      // ((2 ** 52) - 1)
      // left
      0x00,
      0x0f,
      0xff,
      0xff,
      // right
      0xff,
      0xff,
      0xff,
      0xff,
    ]);
    const bigEndianSlice = new DataSlice(bigEndianBytes.buffer, 0, false, true);
    const readLittleEndianBytes = littleEndianSlice.readInt64(0, true);
    const readBigEndianBytes = bigEndianSlice.readInt64(0, false);
    expect(readLittleEndianBytes).to.equal((2 ** 52) - 1);
    expect(readBigEndianBytes).to.equal((2 ** 52) - 1);
  });

  it('DataSlice negative int64 tests', () => {
    const littleEndianBytes = new Uint8Array([
      // -(2 ** 32 - 1)
      // left
      0x01,
      0x00,
      0x00,
      0x00,
      // right
      0x00,
      0x00,
      0xf0,
      0xff,
    ]);
    const littleEndianSlice = new DataSlice(
      littleEndianBytes.buffer,
      0,
      true,
      true,
    );
    const bigEndianBytes = new Uint8Array([
      // -(2 ** 32 - 1)
      // left
      0xff,
      0xf0,
      0x00,
      0x00,
      // right
      0x00,
      0x00,
      0x00,
      0x01,
    ]);
    const bigEndianSlice = new DataSlice(bigEndianBytes.buffer, 0, false, true);
    const readLittleEndianBytes = littleEndianSlice.readInt64(0, true);
    const readBigEndianBytes = bigEndianSlice.readInt64(0, false);
    expect(readLittleEndianBytes).to.equal(-((2 ** 52) - 1));
    expect(readBigEndianBytes).to.equal(-((2 ** 52) - 1));
  });

  it('DataSlice uint64 bit tests', () => {
    const littleEndianBytes = new Uint8Array([
      // ((2 ** 53) - 1)
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
    const littleEndianSlice = new DataSlice(
      littleEndianBytes.buffer,
      0,
      true,
      true,
    );
    const bigEndianBytes = new Uint8Array([
      // ((2 ** 53) - 1)
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
    const readLittleEndianBytes = littleEndianSlice.readOffset(0);
    const readBigEndianBytes = bigEndianSlice.readOffset(0);
    expect(readLittleEndianBytes).to.equal((2 ** 53) - 1);
    expect(readBigEndianBytes).to.equal((2 ** 53) - 1);
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
      width: 3,
    };
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    expect(
      JSON.stringify(newValues.slice(0, -1)),
    ).to.equal(JSON.stringify(originalValues.slice(0, -1)));

    const geoKeys = image.getGeoKeys();
    expect(geoKeys).to.be.an('object');
    expect(geoKeys.GTModelTypeGeoKey).to.equal(2);
    expect(geoKeys.GeographicTypeGeoKey).to.equal(4326);
    expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');

    const { fileDirectory } = image;
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal('WGS 84\u0000');
    expect(fileDirectory.ImageLength).to.equal(3);
    expect(fileDirectory.ImageWidth).to.equal(3);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(1);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal('[1000]'); // hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(1);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(3));
    expect(normalize(fileDirectory.StripByteCounts)).to.equal(normalize(metadata.StripByteCounts));
  });

  it('should write rgb data with sensible defaults', async () => {
    const originalRed = [
      [255, 255, 255],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const originalGreen = [
      [0, 0, 0],
      [255, 255, 255],
      [0, 0, 0],
    ];
    const originalBlue = [
      [0, 0, 0],
      [0, 0, 0],
      [255, 255, 255],
    ];
    const originalValues = [originalRed, originalGreen, originalBlue];
    const metadata = {
      height: 3,
      width: 3,
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
    expect(geoKeys).to.be.an('object');
    expect(geoKeys.GTModelTypeGeoKey).to.equal(2);
    expect(geoKeys.GeographicTypeGeoKey).to.equal(4326);
    expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');

    const { fileDirectory } = image;
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8, 8, 8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal('WGS 84\u0000');
    expect(fileDirectory.ImageLength).to.equal(3);
    expect(fileDirectory.ImageWidth).to.equal(3);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(2);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal('[1000]'); // hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1, 1, 1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(3);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(3));
    expect(toArray(fileDirectory.StripByteCounts).toString()).to.equal('27');
  });

  it('should write flattened pixel values', async () => {
    const originalValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const height = 3;
    const width = 3;

    const metadata = getMockMetaData(height, width);
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    expect(
      JSON.stringify(newValues.slice(0, -1)),
    ).to.equal(JSON.stringify(originalValues.slice(0, -1)));
  });

  it('should write pixel values in two dimensions', async () => {
    const originalValues = [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    ];
    const height = 3;
    const width = 3;

    const metadata = getMockMetaData(height, width);
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const newValues = await image.readRasters();
    const newValuesReshaped = toArray(newValues).map((band) => {
      return chunk(band, width);
    });
    expect(
      JSON.stringify(newValuesReshaped.slice(0, -1)),
    ).to.equal(JSON.stringify(originalValues.slice(0, -1)));
  });

  it('should write metadata correctly', async () => {
    const height = 12;
    const width = 12;
    const originalValues = range(height * width);

    const metadata = getMockMetaData(height, width);
    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    expect(
      JSON.stringify(newValues.slice(0, -1)),
    ).to.equal(JSON.stringify(originalValues.slice(0, -1)));

    const { fileDirectory } = image;
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal('WGS 84\u0000');
    expect(fileDirectory.ImageLength).to.equal(height);
    expect(fileDirectory.ImageWidth).to.equal(width);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(2);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal('[1000]'); // hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(1);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(height));
    expect(normalize(fileDirectory.StripByteCounts)).to.equal(normalize(metadata.StripByteCounts));
    expect(fileDirectory.GDAL_NODATA).to.equal('0\u0000');
  });
});

describe('BlockedSource Test', () => {
  const blockedSource = new BlockedSource(null, { blockSize: 2 });

  it('Groups only contiguous blocks as one group', () => {
    const groups = blockedSource.groupBlocks([2, 0, 1, 3]);
    expect(groups.length).to.equal(1);
    const [group] = groups;
    expect(group.blockIds.length).to.equal(4);
    expect(group.offset).to.equal(0);
    expect(group.length).to.equal(8);
  });

  it('Groups two non-contiguous blocks as two groups', () => {
    const groups = blockedSource.groupBlocks([0, 1, 7, 2, 8, 3]);
    expect(groups.length).to.equal(2);
    const [group1, group2] = groups;
    expect(group1.blockIds.length).to.equal(4);
    expect(group1.blockIds).to.deep.equal([0, 1, 2, 3]);
    expect(group1.offset).to.equal(0);
    expect(group1.length).to.equal(8);
    expect(group2.blockIds.length).to.equal(2);
    expect(group2.offset).to.equal(14);
    expect(group2.length).to.equal(4);
    expect(group2.blockIds).to.deep.equal([7, 8]);
  });
});
