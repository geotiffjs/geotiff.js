
const CRLFCRLF = '\r\n\r\n';

/*
 * Shim for 'Object.fromEntries'
 */
function itemsToObject(items) {
  if (typeof Object.fromEntries !== 'undefined') {
    return Object.fromEntries(items);
  }
  const obj = {};
  for (const [key, value] of items) {
    obj[key.toLowerCase()] = value;
  }
  return obj;
}

/**
 * Parse HTTP headers from a given string.
 * @param {String} text the text to parse the headers from
 * @returns {Object} the parsed headers with lowercase keys
 */
function parseHeaders(text) {
  const items = text
    .split('\r\n')
    .map(line => line.split(':').map(str => str.trim()));

  return itemsToObject(items);
}

/**
 * Parse a 'Content-Type' header value to the content-type and parameters
 * @param {String} rawContentType the raw string to parse from
 * @returns {Object} the parsed content type with the fields: type and params
 */
export function parseContentType(rawContentType) {
  const [type, ...rawParams] = rawContentType.split(';').map(s => s.trim());
  const paramsItems = rawParams.map(param => param.split('='));
  return { type, params: itemsToObject(paramsItems) };
}

/**
 * Parse a 'Content-Range' header value to its start, end, and total parts
 * @param {String} rawContentRange the raw string to parse from
 * @returns {Object} the parsed parts
 */
export function parseContentRange(rawContentRange) {
  const [, start, end, total] = rawContentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
  return {
    start: parseInt(start, 10),
    end: parseInt(end, 10),
    total: parseInt(total, 10),
  };
}

/**
 * Parses a list of byteranges from the given 'multipart/byteranges' HTTP response.
 * Each item in the list has the following properties:
 * - headers: the HTTP headers
 * - data: the sliced ArrayBuffer for that specific part
 * - offset: the offset of the byterange within its originating file
 * - length: the length of the byterange
 * @param {ArrayBuffer} responseArrayBuffer the response to be parsed and split
 * @param {String} boundary the boundary string used to split the sections
 * @returns {Object[]} the parsed byteranges
 */
export function parseByteRanges(responseArrayBuffer, boundary) {
  let offset = 0;
  const decoder = new TextDecoder('ascii');
  const out = [];
  while (offset < responseArrayBuffer.byteLength) {
    const text = decoder.decode(
      new Uint8Array(responseArrayBuffer, offset,
        Math.min(boundary.length + 1024, responseArrayBuffer.byteLength - offset),
      ),
    );

    // break if we arrived at the end
    if (text.length === 0 || text === `${boundary}--`) {
      break;
    }

    // assert that we are actually dealing with a byterange and are at the correct offset
    if (!text.startsWith(boundary)) {
      throw new Error('Part does not start with boundary');
    }

    // get a substring from where we read the headers
    const innerText = text.substr(boundary.length + 2);

    if (innerText.length === 0) {
      break;
    }

    // find the double linebreak that denotes the end of the headers
    const endOfHeaders = innerText.indexOf(CRLFCRLF);

    // parse the headers to get the content range size
    const headers = parseHeaders(innerText.substr(0, endOfHeaders));
    const { start, end } = parseContentRange(headers['content-range']);

    // calculate the length of the slice and the next offset
    const startOfData = offset + boundary.length + endOfHeaders + CRLFCRLF.length;
    const length = parseInt(end, 10) + 1 - parseInt(start, 10);
    out.push({
      headers,
      data: responseArrayBuffer.slice(startOfData, startOfData + length),
      offset: start,
      length,
    });

    offset = startOfData + length + 4;
  }

  return out;
}
