import * as chai from 'chai';

import chaiAsPromised from 'chai-as-promised';

import Worker from 'web-worker';
import Pool from '../src/pool.js';
import create from '../src/worker/create.js';
import { getDecoderParameters, getDecoder } from '../src/compression/index.js';

chai.use(chaiAsPromised);

const { expect } = chai;

class MockIFD {
  constructor(values) {
    this.values = values;
  }

  hasTag(tag) {
    return Object.prototype.hasOwnProperty.call(this.values, tag);
  }

  getValue(tag) {
    return this.values[tag];
  }

  async loadValue(tag) {
    return this.values[tag];
  }
}

describe('Pool', () => {
  it('shall decode a buffer with a worker', async () => {
    const pool = new Pool(1, create);
    const buffer = new ArrayBuffer(1);
    (new Uint8Array(buffer)).set([0]);
    const fileDirectory = new MockIFD({
      Compression: 1,
      ImageWidth: 1,
      ImageLength: 1,
      RowsPerStrip: 1,
      PlanarConfiguration: 1,
      BitsPerSample: 8,
    });
    try {
      const compression = fileDirectory.getValue('Compression');
      const decoderParameters = await getDecoderParameters(compression, fileDirectory);
      const decoder = pool.bindParameters(compression, decoderParameters);
      const decoded = await decoder.decode(buffer);
      const decodedArray = new Uint8Array(decoded);
      expect(decodedArray).to.eql(new Uint8Array([0]));
    } finally {
      pool.destroy();
    }
  });

  it('shall properly propagate an exception', async () => {
    const pool = new Pool(1, () => {
      return new Worker(new URL('../src/worker/decoder.js', import.meta.url), {
        type: 'module',
      });
    });
    const buffer = new ArrayBuffer(1);
    (new Uint8Array(buffer)).set([0]);
    const fileDirectory = new MockIFD({
      Compression: -1,
      ImageWidth: 1,
      ImageLength: 1,
      RowsPerStrip: 1,
      PlanarConfiguration: 1,
      BitsPerSample: 8,
    });
    try {
      const compression = fileDirectory.getValue('Compression');
      await expect(getDecoderParameters(compression, fileDirectory)).to.eventually.be.rejected;
    } finally {
      pool.destroy();
    }
  });

  it('shall not overwrite existing decoders when binding new parameters', async () => {
    const pool = new Pool(1, create);
    try {
      const fileDirectory = new MockIFD({
        Compression: 1,
        ImageWidth: 1,
        ImageLength: 1,
        RowsPerStrip: 1,
        PlanarConfiguration: 1,
        BitsPerSample: 8,
      });
      const compression = fileDirectory.getValue('Compression');
      const decoderParameters = await getDecoderParameters(compression, fileDirectory);

      const decoder1 = pool.bindParameters(compression, decoderParameters);
      const decoder2 = pool.bindParameters(compression, decoderParameters);

      expect(decoder1).to.not.equal(pool);
      expect(decoder2).to.not.equal(decoder1);
      expect(decoder1.decode).to.not.equal(decoder2.decode);
    } finally {
      pool.destroy();
    }
  });

  it('pooled decoder and main thread decoder should produce the same result', async () => {
    const pool = new Pool(1, create);
    try {
      const fileDirectory = new MockIFD({
        Compression: 1,
        ImageWidth: 1,
        ImageLength: 1,
        RowsPerStrip: 1,
        PlanarConfiguration: 1,
        BitsPerSample: 8,
      });
      const compression = fileDirectory.getValue('Compression');
      const decoderParameters = await getDecoderParameters(compression, fileDirectory);
      const decoder = pool.bindParameters(compression, decoderParameters);

      const buffer = new ArrayBuffer(1);
      (new Uint8Array(buffer)).set([0]);

      const decoded = await decoder.decode(buffer);

      const rawDecoder = await getDecoder(compression, decoderParameters);
      const reference = await rawDecoder.decode(buffer);

      expect(decoded).to.eql(reference);
    } finally {
      pool.destroy();
    }
  });
});
