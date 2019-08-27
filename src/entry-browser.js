import { makeFetchSource, makeFileReaderSource } from './loadingBrowser';
import GeoTIFF from './GeoTIFF';
import Pool from './pool';
import parseXml from './browserSpecific/parseXml';

const defaultOptions = {
  xmlParser: parseXml,
};

/**
 * Construct a GeoTIFF from a local file path. This uses the node
 * [filesystem API]{@link https://nodejs.org/api/fs.html} and is
 * not available on browsers.
 * @param {string} path The filepath to read from.
 * @returns {Promise.<GeoTIFF>} The resulting GeoTIFF file.
 */
export async function fromFile(path) {
  return GeoTIFF.fromSource(makeFileReaderSource(path), defaultOptions);
}

/**
 * Creates a new GeoTIFF from a remote URL.
 * @param {string} url The URL to access the image from
 * @param {object} [options] Additional options to pass to the source.
 *                           See {@link makeRemoteSource} for details.
 * @returns {Promise.<GeoTIFF>} The resulting GeoTIFF file.
 */
export async function fromUrl(url, options = defaultOptions) {
  return GeoTIFF.fromSource(makeFetchSource(url, options));
}

export { Pool };
