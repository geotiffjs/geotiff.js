
(function(exports) {
  exports.parse = function(data) {
    var rawData;
    if (typeof data === "string" || data instanceof String) {
      rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
      var view = new Uint16Array(rawData);
      for (var i=0, strLen=data.length; i<strLen; i++) {
        view[i] = data.charCodeAt(i);
      }
    }
    else if (data instanceof ArrayBuffer) {
      rawData = data;
    }
    else {
      throw new Error("Invalid input data given.");
    }
    var GeoTIFF = require("./geotiff.js");
    return new GeoTIFF(rawData);
  };

})((typeof window !== "undefined") ? window["GeoTIFF"] = {} : exports);
