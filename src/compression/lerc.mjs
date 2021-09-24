import { inflate } from 'pako';
import Lerc from 'lerc';
import BaseDecoder from './basedecoder.mjs';
import { LercParameters, LercAddCompression } from '../globals.mjs';

export default class LercDecoder extends BaseDecoder {
  constructor(fileDirectory) {
    super();

    this.planarConfiguration = typeof fileDirectory.PlanarConfiguration !== 'undefined' ? fileDirectory.PlanarConfiguration : 1;
    this.samplesPerPixel = typeof fileDirectory.SamplesPerPixel !== 'undefined' ? fileDirectory.SamplesPerPixel : 1;

    this.addCompression = fileDirectory.LercParameters[LercParameters.AddCompression];
  }

  decodeBlock(buffer) {
    switch (this.addCompression) {
      case LercAddCompression.None:
        break;
      case LercAddCompression.Deflate:
        buffer = inflate(new Uint8Array(buffer)).buffer;
        break;
      default:
        throw new Error(`Unsupported LERC additional compression method identifier: ${this.addCompression}`);
    }

    const lercResult = Lerc.decode(buffer, { returnPixelInterleavedDims: this.planarConfiguration === 1 });
    const lercData = lercResult.pixels[0];
    return lercData.buffer;
  }
}
