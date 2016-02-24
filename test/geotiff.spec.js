var expect = require("chai").expect;
import GeoTIFF from "../src/main.js"

describe("mainTests", function() {
  it("geotiff.js module available", function() {
    expect(GeoTIFF).to.be.ok;
  });

  var retrieve = function(filename, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/base/test/data/' + filename, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      callback(GeoTIFF.parse(this.response));
    };
    xhr.onerror = function(e) {
      console.log(e)
      //throw new Error(e);
    };
    callback;
    xhr.send();
  };

  it("should work on stripped tiffs", function(done) {
    retrieve("stripped.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on tiled tiffs", function(done) {
    retrieve("tiled.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on band interleaved tiffs", function(done) {
    retrieve("interleave.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on band interleaved and tiled tiffs", function(done) {
    retrieve("interleave.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on Int32 tiffs", function(done) {
    retrieve("int32.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Int32Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on UInt32 tiffs", function(done) {
    retrieve("uint32.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint32Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on Float32 tiffs", function(done) {
    retrieve("float32.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float32Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on Float64 tiffs", function(done) {
    retrieve("float64.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float64Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work on packbit compressed tiffs", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        image.readRasters([200, 200, 210, 210], [5], function(data) {
          expect(data[0]).to.deep.equal(allData[5]);
          done();
        }, function(error) {
          done(error);
        });
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work with no options other than a callback", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters(function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(539*448);
        done();
      });
    });
  });

  it("should work with callback and error callback", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters(function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(539*448);
        done();
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work with imageWindow and callback", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(10*10);
        done();
      });
    });
  });

  it("should work with imageWindow, callback and error callback", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters([200, 200, 210, 210], function(allData){
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(10*10);
        done();
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work with imageWindow, samples and callback", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters([200, 200, 210, 210], [0], function(allData){
        expect(allData).to.have.length(1);
        expect(allData[0].length).to.equal(10*10);
        done();
      });
    });
  });

  it("should work with imageWindow, samples, callback and error callback", function(done) {
    retrieve("packbits.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters([200, 200, 210, 210], [0], function(allData){
        expect(allData).to.have.length(1);
        expect(allData[0].length).to.equal(10*10);
        done();
      }, function(error) {
        done(error);
      });
    });
  });

  // TODO: include compressed tiffs, when ready
});

