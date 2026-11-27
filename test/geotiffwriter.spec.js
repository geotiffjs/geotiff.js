/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { fromArrayBuffer, writeArrayBuffer } from '../dist-module/geotiff.js';

describe('Uint8Array writer', () => {
  it('preserves every unsigned byte value and writes independent output', async () => {
    const values = Uint8Array.from({ length: 256 }, (_, i) => i);
    const expected = values.slice();
    const buffer = writeArrayBuffer(values, { width: 16, height: 16 });
    const image = await (await fromArrayBuffer(buffer)).getImage();
    const offset = image.fileDirectory.getValue('StripOffsets')[0];

    expect(buffer.byteLength).to.equal(offset + expected.length);
    expect(new Uint8Array(buffer, offset)).to.deep.equal(expected);
    expect(await image.readRasters({ interleave: true })).to.deep.equal(expected);
    expect(values).to.deep.equal(expected);

    values.fill(0);
    expect(new Uint8Array(buffer, offset)).to.deep.equal(expected);
  });

  it('copies only the supplied subarray, including interleaved RGBA samples', async () => {
    const storage = new Uint8Array([99, 98, 0, 127, 128, 255, 255, 1, 2, 0, 97]);
    const values = storage.subarray(2, 10);
    const original = storage.slice();
    const metadata = { width: 2, height: 1, SamplesPerPixel: 4, PhotometricInterpretation: 2, ExtraSamples: [2] };
    const buffer = writeArrayBuffer(values, { ...metadata });
    const contiguousBuffer = writeArrayBuffer(values.slice(), { ...metadata });

    expect(new Uint8Array(buffer)).to.deep.equal(new Uint8Array(contiguousBuffer));
    const image = await (await fromArrayBuffer(buffer)).getImage();
    expect(await image.readRasters({ interleave: true })).to.deep.equal(values);
    expect(storage).to.deep.equal(original);
  });
});
