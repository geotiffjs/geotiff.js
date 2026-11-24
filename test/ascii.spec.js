/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { ImageFileDirectoryParser } from '../src/imagefiledirectory.js';
import { fieldTypes } from '../src/globals.js';
import { fromArrayBuffer, writeArrayBuffer } from '../dist-module/geotiff.js';

// One ordinary IFD entry, inline or outside the parser's initial read window.
async function readTag(bytes, type, offset = 64, eager = false) {
  const buffer = new ArrayBuffer(offset + bytes.length);
  const view = new DataView(buffer);
  const tag = type === fieldTypes.ASCII ? 305 : 65000;
  view.setUint16(0, 1, true);
  view.setUint16(2, tag, true);
  view.setUint16(4, type, true);
  view.setUint32(6, bytes.length, true);
  if (bytes.length <= 4) {
    new Uint8Array(buffer, 10, bytes.length).set(bytes);
  } else {
    view.setUint32(10, offset, true);
    new Uint8Array(buffer, offset, bytes.length).set(bytes);
  }
  const source = {
    fetch: async (ranges) => ranges.map((range) => buffer.slice(range.offset, range.offset + range.length)),
  };
  const parser = new ImageFileDirectoryParser(source, true, false, eager);
  const ifd = await parser.parseFileDirectoryAt(0);
  return { ifd, tag };
}

describe('ASCII tag values', () => {
  const cases = [
    { name: 'inline string', text: 'A\0', want: 'A' },
    { name: 'empty string', text: '\0', want: '' },
    { name: 'empty final string', text: 'A\0\0', want: 'A\0' },
    { name: 'cached string', text: 'long label\0', want: 'long label' },
    { name: 'cached multiple strings', text: 'first\0second\0', want: 'first\0second' },
    { name: 'deferred string', text: 'long label\0', want: 'long label', offset: 2048 },
    { name: 'deferred multiple strings', text: 'first\0second\0', want: 'first\0second', offset: 2048 },
    { name: 'eager external string', text: 'long label\0', want: 'long label', offset: 2048, eager: true },
    { name: 'unterminated string', text: 'long label', want: 'long label' },
  ];
  for (const { name, text, want, offset, eager } of cases) {
    it(`decodes ${name} without a final terminator`, async () => {
      const { ifd, tag } = await readTag(new TextEncoder().encode(text), fieldTypes.ASCII, offset, eager);
      if (offset === 2048 && !eager) {
        expect(ifd.deferredFields.has(tag)).to.be.true;
      }
      expect(await ifd.loadValue(tag)).to.equal(want);
      expect(ifd.getValue(tag)).to.equal(want);
    });
  }

  for (const type of [fieldTypes.BYTE, fieldTypes.UNDEFINED]) {
    it(`preserves a trailing zero in field type ${type}`, async () => {
      const { ifd, tag } = await readTag(new Uint8Array([65, 0]), type);
      expect(Array.from(await ifd.loadValue(tag))).to.deep.equal([65, 0]);
    });
  }

  it('preserves GeoASCII separators, key offsets and raster values', async () => {
    const bytes = await writeArrayBuffer(new Uint8Array([17, 4]), {
      width: 2,
      height: 1,
      GeoAsciiParams: 'First|Second|',
      GeoKeyDirectory: [1, 1, 0, 2, 1026, 34737, 6, 0, 2049, 34737, 7, 6],
    });
    const image = await (await fromArrayBuffer(bytes)).getImage();
    expect(image.fileDirectory.getValue('GeoAsciiParams')).to.equal('First|Second|');
    expect(image.getGeoKeys()).to.deep.equal({ GTCitationGeoKey: 'First', GeogCitationGeoKey: 'Second' });
    expect(Array.from((await image.readRasters())[0])).to.deep.equal([17, 4]);
  });

  for (const nodata of ['17', '-32768', '0']) {
    it(`preserves the complete GDAL nodata value ${nodata}`, async () => {
      const bytes = await writeArrayBuffer(new Uint8Array([4]), {
        width: 1,
        height: 1,
        GDAL_NODATA: nodata,
      });
      const image = await (await fromArrayBuffer(bytes)).getImage();
      expect(image.getGDALNoData()).to.equal(Number(nodata));
    });
  }
});
