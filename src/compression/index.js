import RawDecoder from './raw.js';
import LZWDecoder from './lzw.js';
import JpegDecoder from './jpeg.js';
import DeflateDecoder from './deflate.js';
import PackbitsDecoder from './packbits.js';
import LercDecoder from './lerc.js';

export function getDecoder(fileDirectory) {
  switch (fileDirectory.Compression) {
    case undefined:
    case 1: // no compression
      return new RawDecoder();
    case 5: // LZW
      return new LZWDecoder();
    case 6: // JPEG
      throw new Error('old style JPEG compression is not supported.');
    case 7: // JPEG
      return new JpegDecoder(fileDirectory);
    case 8: // Deflate as recognized by Adobe
    case 32946: // Deflate GDAL default
      return new DeflateDecoder();
    case 32773: // packbits
      return new PackbitsDecoder();
    case 34887: // LERC
      return new LercDecoder(fileDirectory);
    default:
      throw new Error(`Unknown compression method identifier: ${fileDirectory.Compression}`);
  }
}
