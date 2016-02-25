var expect = require("chai").expect;
import GeoTIFF from "../src/main.js"

describe("mainTests", function() {

  var retrieve = function(filename, done, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/base/test/data/' + filename, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      callback(GeoTIFF.parse(this.response));
    };
    xhr.onerror = function(e) {
      console.error(e);
      done(error);
    };
    callback;
    xhr.send();
  };

  it("geotiff.js module available", function() {
    expect(GeoTIFF).to.be.ok;
  });

  it("should work on stripped tiffs", function(done) {
    retrieve("stripped.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on tiled tiffs", function(done) {
    retrieve("tiled.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on band interleaved tiffs", function(done) {
    retrieve("interleave.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on band interleaved and tiled tiffs", function(done) {
    retrieve("interleave.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Int32 tiffs", function(done) {
    retrieve("int32.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Int32Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on UInt32 tiffs", function(done) {
    retrieve("uint32.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint32Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Float32 tiffs", function(done) {
    retrieve("float32.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float32Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Float64 tiffs", function(done) {
    retrieve("float64.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float64Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on packbit compressed tiffs", function(done) {
    retrieve("packbits.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({window: [200, 200, 210, 210]});
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({window: [200, 200, 210, 210], samples: [5]});
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work with no options other than a callback", function(done) {
    retrieve("small.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters(function(allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(53*44);
        done();
      });
    });
  });

  it("should work with callback and error callback", function(done) {
    retrieve("small.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters(function(allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(53*44);
        done();
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work with options and callback", function(done) {
    retrieve("packbits.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters({window: [200, 200, 210, 210]}, function(allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(10*10);
        done();
      });
    });
  });

  it("should work with options, callback and error callback", function(done) {
    retrieve("packbits.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters({window: [200, 200, 210, 210]}, function(allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(10*10);
        done();
      }, function(error) {
        done(error);
      });
    });
  });

  it("should work with interleaved reading", function(done) {
    retrieve("packbits.tiff", done, function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      try {
        var raster = image.readRasters({window: [200, 200, 210, 210], samples: [0, 1, 2, 3], interleave: true});
        expect(raster).to.have.length(10 * 10 * 4);
        expect(raster).to.be.an.instanceof(Uint16Array);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  // TODO: include compressed tiffs, when ready
});

