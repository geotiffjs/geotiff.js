var chai = require("chai");
var expect = chai.expect;

var _ = require("lodash");
var flattenDeep = _.flattenDeep;
var chunk = _.chunk;

var Promise = require('es6-promise').Promise;

import GeoTIFF from "../src/main.js"

var retrieve = function (filename, done, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/base/test/data/' + filename, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function (e) {
    callback(GeoTIFF.parse(this.response));
  };
  xhr.onerror = function (e) {
    console.error(e);
    done(e);
  };
  callback;
  xhr.send();
};

var retrieveSync = function (filename, done, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/base/test/data/' + filename, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function (e) {
    callback(GeoTIFF.parse(this.response));
  };
  xhr.onerror = function (e) {
    console.error(e);
    done(e);
  };
  callback;
  xhr.send();
};

var toArrayRecursively = function (input) {
  if (input.length) {
    return _.toArray(input).map(toArrayRecursively);
  }
  else {
    return input;
  }
}

var normalize = function (input) {
  return JSON.stringify(toArrayRecursively(input));
}

var getMockMetaData = function (height, width) {
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

describe("mainTests", function () {
  it("geotiff.js module available", function () {
    expect(GeoTIFF).to.be.ok;
  });

  it("should work on stripped tiffs", function (done) {
    retrieve("stripped.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on tiled tiffs", function (done) {
    retrieve("tiled.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on band interleaved tiffs", function (done) {
    retrieve("interleave.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on band interleaved and tiled tiffs", function (done) {
    retrieve("interleave.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on LZW compressed images", function (done) {
    retrieve("lzw.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on band interleaved, lzw compressed, and tiled tiffs", function (done) {
    retrieve("tiledplanarlzw.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Int32 tiffs", function (done) {
    retrieve("int32.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Int32Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on UInt32 tiffs", function (done) {
    retrieve("uint32.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint32Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Float32 tiffs", function (done) {
    retrieve("float32.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float32Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Float64 tiffs", function (done) {
    retrieve("float64.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float64Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on Float64 and lzw compressed tiffs", function (done) {
    retrieve("float64lzw.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Float64Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work on packbit compressed tiffs", function (done) {
    retrieve("packbits.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);

      try {
        var allData = image.readRasters({ window: [200, 200, 210, 210] });
        expect(allData).to.have.length(15);
        expect(allData[0]).to.be.an.instanceof(Uint16Array);
        var data = image.readRasters({ window: [200, 200, 210, 210], samples: [5] });
        expect(data[0]).to.deep.equal(allData[5]);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work with no options other than a callback", function (done) {
    retrieve("small.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters(function (allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(53 * 44);
        done();
      });
    });
  });

  it("should work with callback and error callback", function (done) {
    retrieve("small.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters(function (allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(53 * 44);
        done();
      }, function (error) {
        done(error);
      });
    });
  });

  it("should work with options and callback", function (done) {
    retrieve("packbits.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters({ window: [200, 200, 210, 210] }, function (allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(10 * 10);
        done();
      });
    });
  });

  it("should work with options, callback and error callback", function (done) {
    retrieve("packbits.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      image.readRasters({ window: [200, 200, 210, 210] }, function (allData) {
        expect(allData).to.have.length(15);
        expect(allData[0].length).to.equal(10 * 10);
        done();
      }, function (error) {
        done(error);
      });
    });
  });

  it("should work with interleaved reading", function (done) {
    retrieve("packbits.tiff", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      try {
        var raster = image.readRasters({ window: [200, 200, 210, 210], samples: [0, 1, 2, 3], interleave: true });
        expect(raster).to.have.length(10 * 10 * 4);
        expect(raster).to.be.an.instanceof(Uint16Array);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });

  it("should work with BigTIFFs", function (done) {
    retrieve("BigTIFF.tif", done, function (tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      try {
        var raster = image.readRasters({ samples: [0, 1, 2], interleave: true });
        // expect(raster).to.have.length(10 * 10 * 3);
        expect(raster).to.be.an.instanceof(Uint8Array);
        done();
      }
      catch (error) {
        done(error);
      }
    });
  });
});

describe("RGB-tests", function () {
  var options = { window: [250, 250, 300, 300], interleave: true };

  var comparisonPromise = new Promise(function (resolve, reject) {
    retrieve("rgb.tiff", reject, function (tiff) {
      try {
        //console.log("tiff.fileDirectories:", JSON.stringify(tiff.fileDirectories));
        var image = tiff.getImage();
        resolve(image.readRasters(options));
      }
      catch (error) {
        reject(error);
      }
    });
  });

  it("should work with CMYK files", function (done) {
    retrieve("cmyk.tif", done, function (tiff) {
      comparisonPromise.then(function (comparisonRaster) {
        expect(tiff).to.be.ok;
        var image = tiff.getImage();
        image.readRGB(options, function (rgbRaster) {
          expect(rgbRaster).to.have.lengthOf(comparisonRaster.length);
          var diff = new Float32Array(rgbRaster);
          for (var i = 0; i < rgbRaster.length; ++i) {
            diff[i] = Math.abs(comparisonRaster[i] - rgbRaster[i]);
          }
          expect(Math.max.apply(null, diff)).to.be.at.most(1);
          done();
        }, done);
      }, done);
    });
  });

  it("should work with YCbCr files", function (done) {
    retrieve("ycbcr.tif", done, function (tiff) {
      comparisonPromise.then(function (comparisonRaster) {
        expect(tiff).to.be.ok;
        var image = tiff.getImage();
        image.readRGB(options, function (rgbRaster) {
          expect(rgbRaster).to.have.lengthOf(comparisonRaster.length);
          var diff = new Float32Array(rgbRaster);
          for (var i = 0; i < rgbRaster.length; ++i) {
            diff[i] = Math.abs(comparisonRaster[i] - rgbRaster[i]);
          }
          expect(Math.max.apply(null, diff)).to.be.at.most(3);
          done();
        }, done);
      }, done);
    });
  });

  it("should work with paletted files", function (done) {
    retrieve("rgb_paletted.tiff", done, function (tiff) {
      comparisonPromise.then(function (comparisonRaster) {
        expect(tiff).to.be.ok;
        var image = tiff.getImage();
        image.readRGB(options, function (rgbRaster) {
          expect(rgbRaster).to.have.lengthOf(comparisonRaster.length);
          var diff = new Float32Array(rgbRaster);
          for (var i = 0; i < rgbRaster.length; ++i) {
            diff[i] = Math.abs(comparisonRaster[i] - rgbRaster[i]);
          }
          expect(Math.max.apply(null, diff)).to.be.at.most(15);
          done();
        }, done);
      }, done);
    });
  });
});

describe("writeTests", function () {

  it("should write flattened pixel values", function () {

    var original_values = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    let height = 3;
    let width = 3;

    var metadata = getMockMetaData(height, width);

    var new_geotiff_as_binary_data = GeoTIFF.create(original_values, metadata);

    var new_geotiff = GeoTIFF.parse(new_geotiff_as_binary_data);

    var new_values = toArrayRecursively(new_geotiff.getImage().readRasters()[0]);

    expect(JSON.stringify(new_values)).to.equal(JSON.stringify(original_values));

  });

  it("should write pixel values in two dimensions", function () {

    var original_values = [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]
    ];

    let height = 3;
    let width = 3;

    var metadata = getMockMetaData(height, width);

    var new_geotiff_as_binary_data = GeoTIFF.create(original_values, metadata);

    var new_geotiff = GeoTIFF.parse(new_geotiff_as_binary_data);

    var new_values = new_geotiff.getImage().readRasters();
    var new_values_reshaped = _.toArray(new_values).map(function (band) {
      return chunk(_.toArray(band), width);
    });

    expect(JSON.stringify(new_values_reshaped)).to.equal(JSON.stringify(original_values));

  });


  it("should write metadata correctly", function () {


    var height = 12;
    var width = 12;
    var original_values = _.range(height * width);

    var metadata = getMockMetaData(height, width);

    var new_geotiff_as_binary_data = GeoTIFF.create(original_values, metadata);

    var new_geotiff = GeoTIFF.parse(new_geotiff_as_binary_data);

    var new_values = toArrayRecursively(new_geotiff.getImage().readRasters()[0]);

    expect(JSON.stringify(new_values)).to.equal(JSON.stringify(original_values));

    var fileDirectory = new_geotiff.fileDirectories[0][0];
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
