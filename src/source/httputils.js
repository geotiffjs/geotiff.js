const CRLFCRLF = '\r\n\r\n';

/**
 * Shim for 'Object.fromEntries'
 * @template T
 * @param {Array<[string, T]>} items
 * @return {Record<string, T>}
 */
function itemsToObject(items) {
  if (typeof Object.fromEntries !== 'undefined') {
    return Object.fromEntries(items);
  }
  /** @type {Record<string, T>} */
  const obj = {};
  for (const [key, value] of items) {
    obj[key.toLowerCase()] = value;
  }
  return obj;
}

/**
 * Parse HTTP headers from a given string.
 * @param {string} text the text to parse the headers from
 * @returns {Record<string, string>} the parsed headers with lowercase keys
 */
function parseHeaders(text) {
  /** @type {Array<[string, string]>} */
  const items = text
    .split('\r\n')
    .map((line) => {
      const kv = /** @type {[string, string]} */ (line.split(':').map((str) => str.trim()));
      kv[0] = kv[0].toLowerCase();
      return kv;
    });

  return itemsToObject(items);
}

/**
 * Parse a 'Content-Type' header value to the content-type and parameters
 * @param {string|undefined} rawContentType the raw string to parse from
 * @returns {{type: string|null, params: Record<string, string>}}
 *     the parsed content type with the fields: type and params
 */
export function parseContentType(rawContentType) {
  if (!rawContentType) {
    return { type: null, params: {} };
  }
  const [type, ...rawParams] = rawContentType.split(';').map((s) => s.trim());
  const paramsItems = /** @type {Array<[string, string]>} */ (rawParams.map((param) => param.split('=')));
  return { type, params: itemsToObject(paramsItems) };
}

/**
 * Parse a 'Content-Range' header value to its start, end, and total parts
 * @param {string|undefined} rawContentRange the raw string to parse from
 * @returns {{start: number, end: number, total: number}} the parsed parts
 */
export function parseContentRange(rawContentRange) {
  let start = NaN;
  let end = NaN;
  let total = NaN;

  if (rawContentRange) {
    [, start, end, total] = (rawContentRange.match(/bytes (\d+)-(\d+)\/(\d+)/) || []).map(Number);
  }

  return { start, end, total };
}

/**
 * Parses a list of byteranges from the given 'multipart/byteranges' HTTP response.
 * Each item in the list has the following properties:
 * - headers: the HTTP headers
 * - data: the sliced ArrayBuffer for that specific part
 * - offset: the offset of the byterange within its originating file
 * - length: the length of the byterange
 * @param {ArrayBuffer} responseArrayBuffer the response to be parsed and split
 * @param {string} boundary the boundary string used to split the sections
 * @returns {Array<{headers: Record<string, string>, data: ArrayBuffer, offset: number, length: number, fileSize: number}>}
 *     the parsed byteranges
 */
export function parseByteRanges(responseArrayBuffer, boundary) {
  let offset = -1;
  const decoder = new TextDecoder('ascii');
  const out = [];

  const startBoundary = `--${boundary}`;
  const endBoundary = `${startBoundary}--`;

  // search for the initial boundary, may be offset by some bytes
  // TODO: more efficient to check for `--` in bytes directly
  for (let i = 0; i < 10; ++i) {
    const text = decoder.decode(
      new Uint8Array(responseArrayBuffer, i, startBoundary.length),
    );
    if (text === startBoundary) {
      offset = i;
    }
  }

  if (offset === -1) {
    throw new Error('Could not find initial boundary');
  }

  while (offset < responseArrayBuffer.byteLength) {
    const text = decoder.decode(
      new Uint8Array(responseArrayBuffer, offset,
        Math.min(startBoundary.length + 1024, responseArrayBuffer.byteLength - offset),
      ),
    );

    // break if we arrived at the end
    if (text.length === 0 || text.startsWith(endBoundary)) {
      break;
    }

    // assert that we are actually dealing with a byterange and are at the correct offset
    if (!text.startsWith(startBoundary)) {
      throw new Error('Part does not start with boundary');
    }

    // get a substring from where we read the headers
    const innerText = text.substr(startBoundary.length + 2);

    if (innerText.length === 0) {
      break;
    }

    // find the double linebreak that denotes the end of the headers
    const endOfHeaders = innerText.indexOf(CRLFCRLF);

    // parse the headers to get the content range size
    const headers = parseHeaders(innerText.substr(0, endOfHeaders));
    const { start, end, total } = parseContentRange(headers['content-range']);

    // calculate the length of the slice and the next offset
    const startOfData = offset + startBoundary.length + endOfHeaders + CRLFCRLF.length;
    const length = end + 1 - start;
    out.push({
      headers,
      data: responseArrayBuffer.slice(startOfData, startOfData + length),
      offset: start,
      length,
      fileSize: total,
    });

    offset = startOfData + length + 4;
  }

  return out;
}
