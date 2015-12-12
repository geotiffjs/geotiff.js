
(function() {
  var parse = function(data) {
    var rawData, i, strLen, view;
    if (typeof data === "string" || data instanceof String) {
      rawData = new ArrayBuffer(data.length * 2); // 2 bytes for each char
      view = new Uint16Array(rawData);
      for (i=0, strLen=data.length; i<strLen; i++) {
        view[i] = data.charCodeAt(i);
      }
    }
    else if (data instanceof ArrayBuffer) {
      rawData = data;
    }
    else if (typeof Buffer !== "undefined" && data instanceof Buffer) {
      rawData = new ArrayBuffer(data.length);
      view = new Uint8Array(rawData);
      for (i=0; i<data.length; ++i) {
        view[i] = data[i];
      }
    }
    else {
      throw new Error("Invalid input data given.");
    }
    var GeoTIFF = require("./geotiff.js");
    return new GeoTIFF(rawData);
  };

  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports.parse = parse;
  }
  if (typeof window !== "undefined") {
    window["GeoTIFF"] = {parse:parse};
  }
})();
