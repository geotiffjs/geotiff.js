import { Buffer } from 'buffer';
import { open, read } from 'fs';
import http from 'http';
import https from 'https';
import urlMod from 'url';
import BlockedSource from './source';

/**
 * Create a new source to read from a remote file using the node
 * [http]{@link https://nodejs.org/api/http.html} API.
 * @param {string} url The URL to send requests to.
 * @param {Object} [options] Additional options.
 * @param {Number} [options.blockSize] The block size to use.
 * @param {object} [options.headers] Additional headers to be sent to the server.
 */
export function makeHttpSource(url, { headers = {}, blockSize } = {}) {
  return new BlockedSource(async (offset, length) => new Promise((resolve, reject) => {
    const parsed = urlMod.parse(url);
    const request = (parsed.protocol === 'http:' ? http : https).get(
      Object.assign({}, parsed, {
        headers: Object.assign({},
          headers, {
            Range: `bytes=${offset}-${offset + length}`,
          },
        ),
      }), (result) => {
        const chunks = [];
        // collect chunks
        result.on('data', (chunk) => {
          chunks.push(chunk);
        });

        // concatenate all chunks and resolve the promise with the resulting buffer
        result.on('end', () => {
          const data = Buffer.concat(chunks).buffer;
          resolve({
            data,
            offset,
            length: data.byteLength,
          });
        });
      },
    );
    request.on('error', reject);
  }), { blockSize });
}


function openAsync(path, flags, mode = undefined) {
  return new Promise((resolve, reject) => {
    open(path, flags, mode, (err, fd) => {
      if (err) {
        reject(err);
      } else {
        resolve(fd);
      }
    });
  });
}

function readAsync(...args) {
  return new Promise((resolve, reject) => {
    read(...args, (err, bytesRead, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve({ bytesRead, buffer });
      }
    });
  });
}

/**
 * Creates a new source using the node filesystem API.
 * @param {string} path The path to the file in the local filesystem.
 * @returns The constructed source
 */
export function makeFileSource(path) {
  const fileOpen = openAsync(path, 'r');

  return {
    async fetch(offset, length) {
      const fd = await fileOpen;
      const { buffer } = await readAsync(fd, Buffer.alloc(length), 0, length, offset);
      return buffer.buffer;
    },
  };
}
