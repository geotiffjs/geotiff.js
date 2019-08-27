import { makeFileSource, makeHttpSource } from './loadingNode';
import GeoTIFF from './GeoTIFF';
import Pool from './pool';
import writeGeotiff from './geotiffwriter';
import parseXml from './nodeSpecific/parseXml';

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
  return GeoTIFF.fromSource(makeFileSource(path), defaultOptions);
}

/**
 * Creates a new GeoTIFF from a remote URL.
 * @param {string} url The URL to access the image from
 * @param {object} [options] Additional options to pass to the source.
 *                           See {@link makeRemoteSource} for details.
 * @returns {Promise.<GeoTIFF>} The resulting GeoTIFF file.
 */
export async function fromUrl(url, options = defaultOptions) {
  return GeoTIFF.fromSource(makeHttpSource(url, options));
}

/**
 * Main creating function for GeoTIFF files.
 * @param {(Array)} array of pixel values
 * @returns {metadata} metadata
 */
export async function writeArrayBuffer(values, metadata) {
  return writeGeotiff(values, metadata);
}


export { Pool };
