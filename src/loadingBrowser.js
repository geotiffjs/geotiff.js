import BlockedSource from './source';

/**
 * Create a new source to read from a remote file using the
 * [fetch]{@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API} API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 * @returns The constructed source
 */
export function makeFetchSource(url, { headers = {}, blockSize } = {}) {
  return new BlockedSource(async (offset, length) => {
    const response = await fetch(url, {
      headers: Object.assign({},
        headers, {
          Range: `bytes=${offset}-${offset + length}`,
        },
      ),
    });

    // check the response was okay and if the server actually understands range requests
    if (!response.ok) {
      throw new Error('Error fetching data.');
    } else if (response.status === 206) {
      const data = response.arrayBuffer ?
        await response.arrayBuffer() : (await response.buffer()).buffer;
      return {
        data,
        offset,
        length,
      };
    } else {
      const data = response.arrayBuffer ?
        await response.arrayBuffer() : (await response.buffer()).buffer;
      return {
        data,
        offset: 0,
        length: data.byteLength,
      };
    }
  }, { blockSize });
}

/**
 * Create a new source to read from a remote file using the
 * [XHR]{@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest} API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 * @returns The constructed source
 */
export function makeXHRSource(url, { headers = {}, blockSize } = {}) {
  return new BlockedSource(async (offset, length) => {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url);
      request.responseType = 'arraybuffer';

      Object.entries(
        Object.assign({},
          headers, {
            Range: `bytes=${offset}-${offset + length}`,
          },
        ),
      ).forEach(([key, value]) => request.setRequestHeader(key, value));

      request.onload = () => {
        const data = request.response;
        if (request.status === 206) {
          resolve({
            data,
            offset,
            length,
          });
        } else {
          resolve({
            data,
            offset: 0,
            length: data.byteLength,
          });
        }
      };
      request.onerror = reject;
      request.send();
    });
  }, { blockSize });
}

/**
 * Create a new source from a given file/blob.
 * @param {Blob} file The file or blob to read from.
 * @returns The constructed source
 */
export function makeFileReaderSource(file) {
  return {
    async fetch(offset, length) {
      return new Promise((resolve, reject) => {
        const blob = file.slice(offset, offset + length);
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    },
  };
}
