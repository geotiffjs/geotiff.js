import { expect } from 'chai';
import { fromArrayBuffer } from '../dist-module/geotiff.js';

// Build a minimal baseline TIFF: width x height, single sample, 16-bit,
// uncompressed, one strip, horizontal differencing predictor (tag 317 = 2),
// in the requested byte order. The strip data is the per-row first-difference
// of `rows` (what a predictor-2 encoder stores); geotiff.js must accumulate it
// back to `rows` regardless of the file's byte order.
function makeTiff(littleEndian, width, height, rows) {
  const entries = [
    [256, 3, 1, width], // ImageWidth
    [257, 3, 1, height], // ImageLength
    [258, 3, 1, 16], // BitsPerSample
    [259, 3, 1, 1], // Compression = none
    [262, 3, 1, 1], // PhotometricInterpretation = BlackIsZero
    [273, 4, 1, 8 + 2 + (12 * 11) + 4], // StripOffsets (after the IFD)
    [277, 3, 1, 1], // SamplesPerPixel
    [278, 3, 1, height], // RowsPerStrip
    [279, 4, 1, (width * height * 2)], // StripByteCounts
    [317, 3, 1, 2], // Predictor = horizontal differencing
    [339, 3, 1, 1], // SampleFormat = unsigned int
  ];
  const ifdStart = 8;
  const stripStart = ifdStart + 2 + (12 * entries.length) + 4;
  const buf = new ArrayBuffer(stripStart + (width * height * 2));
  const dv = new DataView(buf);
  dv.setUint16(0, littleEndian ? 0x4949 : 0x4d4d, littleEndian);
  dv.setUint16(2, 42, littleEndian);
  dv.setUint32(4, ifdStart, littleEndian);
  dv.setUint16(ifdStart, entries.length, littleEndian);
  entries.forEach(([tag, type, count, value], i) => {
    const o = ifdStart + 2 + (i * 12);
    dv.setUint16(o, tag, littleEndian);
    dv.setUint16(o + 2, type, littleEndian);
    dv.setUint32(o + 4, count, littleEndian);
    if (type === 3) {
      dv.setUint16(o + 8, value, littleEndian);
    } else {
      dv.setUint32(o + 8, value, littleEndian);
    }
  });
  dv.setUint32(ifdStart + 2 + (entries.length * 12), 0, littleEndian); // next IFD
  let o = stripStart;
  for (const row of rows) {
    let prev = 0;
    for (const v of row) {
      dv.setUint16(o, (v - prev) & 0xffff, littleEndian); // store difference
      prev = v;
      o += 2;
    }
  }
  return buf;
}

const rows = [
  [10, 20, 30, 40],
  [1000, 1500, 60000, 65535],
];
const expected = [10, 20, 30, 40, 1000, 1500, 60000, 65535];

async function read(buf) {
  const tiff = await fromArrayBuffer(buf);
  const image = await tiff.getImage();
  return Array.from((await image.readRasters())[0]);
}

describe('predictor 2 with byte order', () => {
  it('decodes a little-endian (II) predictor=2 image', async () => {
    expect(await read(makeTiff(true, 4, 2, rows))).to.deep.equal(expected);
  });

  it('decodes a big-endian (MM) predictor=2 image', async () => {
    expect(await read(makeTiff(false, 4, 2, rows))).to.deep.equal(expected);
  });
});
