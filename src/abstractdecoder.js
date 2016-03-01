"use strict";

function AbstractDecoder() { }

AbstractDecoder.prototype = {
  isAsync: function() {
    // TODO: check if async reading func is enabled or not.
    return (typeof this.decodeBlock === "undefined");
  }
};

module.exports = AbstractDecoder;