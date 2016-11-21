'use strict';

import AbstractDecoder from '../abstractdecoder.js';

export default class DeflateDecoder extends AbstractDecoder {
  decodeBlock() {
    throw new Error("not supported");
  }
}
