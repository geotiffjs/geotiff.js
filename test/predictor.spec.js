import { expect } from 'chai';

import { applyPredictor } from '../src/predictor.js';

describe('applyPredictor', () => {
  it('accumulates 16-bit horizontal differences in the file byte order', () => {
    // Two RGB pixels: (123, 45, 67), then differences (3000, 0, 1700).
    const encoded = [123, 45, 67, 3000, 0, 1700];
    for (const littleEndian of [true, false]) {
      const view = new DataView(new ArrayBuffer(encoded.length * 2));
      encoded.forEach((value, i) => view.setUint16(i * 2, value, littleEndian));
      applyPredictor(view.buffer, 2, 2, 1, [16, 16, 16], 1, littleEndian);
      const decoded = encoded.map((_, i) => view.getUint16(i * 2, littleEndian));
      expect(decoded).to.deep.equal([123, 45, 67, 3123, 45, 1767]);
    }
  });

  it('reassembles floating point differences in the file byte order', () => {
    // One float32 sample, 1.5 (0x3fc00000), stored as byte planes differenced along the row.
    for (const littleEndian of [true, false]) {
      const block = Uint8Array.from([0x3f, 0x81, 0x40, 0x00]).buffer;
      applyPredictor(block, 3, 1, 1, [32], 1, littleEndian);
      expect(new DataView(block).getFloat32(0, littleEndian)).to.equal(1.5);
    }
  });
});
