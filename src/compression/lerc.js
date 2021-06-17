import { inflate } from 'pako';
import Lerc from 'lerc';
import BaseDecoder from './basedecoder';
import { LercParameters, LercAddCompression } from '../globals';

export default class LercDecoder extends BaseDecoder {
  constructor(fileDirectory) {
    super();

    this.planarConfiguration = typeof fileDirectory.PlanarConfiguration !== 'undefined' ? fileDirectory.PlanarConfiguration : 1;
    this.samplesPerPixel = typeof fileDirectory.SamplesPerPixel !== 'undefined' ? fileDirectory.SamplesPerPixel : 1;

    this.addCompression = fileDirectory.LercParameters[LercParameters.AddCompression];
  }

  interleavePixels(bandInterleavedData) {
    const pixelInterleavedData = new bandInterleavedData.constructor(bandInterleavedData.length);
    const lengthPerSample = bandInterleavedData.length / this.samplesPerPixel;
    for (let i = 0; i < lengthPerSample; i++) {
      for (let j = 0; j < this.samplesPerPixel; j++) {
        pixelInterleavedData[i * this.samplesPerPixel + j] = bandInterleavedData[i + j * lengthPerSample];
      }
    }
    return pixelInterleavedData;
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

    const lercResult = Lerc.decode(buffer);
    const lercData = lercResult.pixels[0]; // always band-interleaved
    const decodedData = this.planarConfiguration === 1 ? this.interleavePixels(lercData) : lercData; // transform to pixel-interleaved if expected
    return decodedData.buffer;
  }
}
