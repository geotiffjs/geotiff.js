/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */

import isNode from 'detect-node';
import { expect } from 'chai';
import 'isomorphic-fetch';

import GeoTIFF from '../src/main';

const retrieve = isNode ? async (filename, done, callback) => {
  const fs = require('fs');
  fs.readFile(`test/data/${filename}`, (err, contents) => {
    if (err) {
      done(err);
    } else {
      const tiff = GeoTIFF.parse(contents.buffer);
      callback(tiff);
    }
  });
} : async (filename, done, callback) => {
  const response = await fetch(`/base/test/data/${filename}`);
  const data = await response.arrayBuffer();
  callback(GeoTIFF.parse(data));
};

describe('mainTests', () => {
  it('geotiff.js module available', () => {
    expect(GeoTIFF).to.be.ok;
  });

  it('should work on stripped tiffs', (done) => {
    retrieve('stripped.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on tiled tiffs', (done) => {
    retrieve('tiled.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on band interleaved tiffs', (done) => {
    retrieve('interleave.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on band interleaved and tiled tiffs', (done) => {
    retrieve('interleave.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on LZW compressed images', (done) => {
    retrieve('lzw.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on band interleaved, lzw compressed, and tiled tiffs', (done) => {
    retrieve('tiledplanarlzw.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on Int32 tiffs', (done) => {
    retrieve('int32.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Int32Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on UInt32 tiffs', (done) => {
    retrieve('uint32.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint32Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on Float32 tiffs', (done) => {
    retrieve('float32.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Float32Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on Float64 tiffs', (done) => {
    retrieve('float64.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Float64Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on Float64 and lzw compressed tiffs', (done) => {
    retrieve('float64lzw.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Float64Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work on packbit compressed tiffs', (done) => {
    retrieve('packbits.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        Promise.all([
          image.readRasters({ window: [200, 200, 210, 210] }),
          image.readRasters({ window: [200, 200, 210, 210], samples: [5] }),
        ])
          .then(([allData, data]) => {
            expect(allData).to.have.length(15);
            expect(allData[0]).to.be.an.instanceof(Uint16Array);
            expect(data[0]).to.deep.equal(allData[5]);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work with interleaved reading', (done) => {
    retrieve('packbits.tiff', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      try {
        image.readRasters({ window: [200, 200, 210, 210], samples: [0, 1, 2, 3], interleave: true })
          .then((raster) => {
            expect(raster).to.have.length(10 * 10 * 4);
            expect(raster).to.be.an.instanceof(Uint16Array);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });

  it('should work with BigTIFFs', (done) => {
    retrieve('BigTIFF.tif', done, (tiff) => {
      expect(tiff).to.be.ok;
      const image = tiff.getImage();
      try {
        image.readRasters({ samples: [0, 1, 2], interleave: true })
          .then((raster) => {
            // expect(raster).to.have.length(10 * 10 * 3);
            expect(raster).to.be.an.instanceof(Uint8Array);
            done();
          });
      } catch (error) {
        done(error);
      }
    });
  });
});

describe('RGB-tests', () => {
  const options = { window: [250, 250, 300, 300], interleave: true };

  const comparisonPromise = new Promise((resolve, reject) => {
    retrieve('rgb.tiff', reject, (tiff) => {
      try {
        const image = tiff.getImage();
        resolve(image.readRasters(options));
      } catch (error) {
        reject(error);
      }
    });
  });

  it('should work with CMYK files', (done) => {
    retrieve('cmyk.tif', done, (tiff) => {
      const image = tiff.getImage();
      Promise.all([comparisonPromise, image.readRGB(options)])
        .then(([comparisonRaster, rgbRaster]) => {
          expect(tiff).to.be.ok;
          expect(rgbRaster).to.have.lengthOf(comparisonRaster.length);
          const diff = new Float32Array(rgbRaster);
          for (let i = 0; i < rgbRaster.length; ++i) {
            diff[i] = Math.abs(comparisonRaster[i] - rgbRaster[i]);
          }
          expect(Math.max.apply(null, diff)).to.be.at.most(1);
          done();
        }, done);
    });
  });

  it('should work with YCbCr files', (done) => {
    retrieve('ycbcr.tif', done, (tiff) => {
      const image = tiff.getImage();
      Promise.all([comparisonPromise, image.readRGB(options)])
        .then(([comparisonRaster, rgbRaster]) => {
          expect(tiff).to.be.ok;
          expect(rgbRaster).to.have.lengthOf(comparisonRaster.length);
          const diff = new Float32Array(rgbRaster);
          for (let i = 0; i < rgbRaster.length; ++i) {
            diff[i] = Math.abs(comparisonRaster[i] - rgbRaster[i]);
          }
          expect(Math.max.apply(null, diff)).to.be.at.most(3);
          done();
        }, done);
    });
  });

  it('should work with paletted files', (done) => {
    retrieve('rgb_paletted.tiff', done, (tiff) => {
      const image = tiff.getImage();
      Promise.all([comparisonPromise, image.readRGB(options)])
        .then(([comparisonRaster, rgbRaster]) => {
          expect(tiff).to.be.ok;
          expect(rgbRaster).to.have.lengthOf(comparisonRaster.length);
          const diff = new Float32Array(rgbRaster);
          for (let i = 0; i < rgbRaster.length; ++i) {
            diff[i] = Math.abs(comparisonRaster[i] - rgbRaster[i]);
          }
          expect(Math.max.apply(null, diff)).to.be.at.most(15);
          done();
        }, done);
    });
  });
});
