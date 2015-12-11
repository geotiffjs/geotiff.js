var GeoTIFF = require("../src/main.js");
var expect = require("chai").expect;


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

  it("Test stripped", function(done) {
    retrieve("stripped.tiff", function(tiff) {
      expect(tiff).to.be.ok;
      var image = tiff.getImage();
      expect(image).to.be.ok;
      expect(image.getWidth()).to.equal(539);
      expect(image.getHeight()).to.equal(448);
      expect(image.getSamplesPerPixel()).to.equal(15);
      done();
    });
  });
});

