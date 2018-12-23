export function assign(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}

export function chunk(iterable, length) {
  const results = [];
  const lengthOfIterable = iterable.length;
  for (let i = 0; i < lengthOfIterable; i += length) {
    const chunked = [];
    for (let ci = i; ci < i + length; ci++) {
      chunked.push(iterable[ci]);
    }
    results.push(chunked);
  }
  return results;
}

export function endsWith(string, expectedEnding) {
  if (string.length < expectedEnding.length) {
    return false;
  }
  const actualEnding = string.substr(string.length - expectedEnding.length);
  return actualEnding === expectedEnding;
}

export function forEach(iterable, func) {
  const { length } = iterable;
  for (let i = 0; i < length; i++) {
    func(iterable[i], i);
  }
}

export function invert(oldObj) {
  const newObj = {};
  for (const key in oldObj) {
    if (oldObj.hasOwnProperty(key)) {
      const value = oldObj[key];
      newObj[value] = key;
    }
  }
  return newObj;
}

export function range(n) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(i);
  }
  return results;
}

export function times(numTimes, func) {
  const results = [];
  for (let i = 0; i < numTimes; i++) {
    results.push(func(i));
  }
  return results;
}

export function toArray(iterable) {
  const results = [];
  const { length } = iterable;
  for (let i = 0; i < length; i++) {
    results.push(iterable[i]);
  }
  return results;
}

export function toArrayRecursively(input) {
  if (input.length) {
    return toArray(input).map(toArrayRecursively);
  }
  return input;
}

export function getUint24(dataView, pos) {
	return (dataView.getUint16(pos) << 8) + dataView.getUint8(pos+2);
}

export function getBits(buffer) {
  let bits = [];
  const mask = parseInt('1'.repeat(8), 2);
  (new Uint8Array(buffer)).forEach(v => {
    //console.log("original:", v.toString(2));
    //console.log("padded  :", padLeft(v.toString(2), 8));
    Array.from(padLeft(v.toString(2), 8)).forEach((bit, i) => {
      bits.push(bit);
    });
  });
  console.log("bits.length:", bits.length);
  return bits;
}

export function logBits(bits, bytesPerRow) {
  const bitsPerRow = bytesPerRow * 8;
  console.log("bitsPerRow:", bitsPerRow);
  let text = "";
  bits.forEach((bit, i) => {
    if (i % bitsPerRow === 0) {
      text += "\n";
    } else if ((i % bitsPerRow) % 55 === 0) {
      text += " ";
    }
    text += bit;
  });
  console.log(text);
}

export function padLeft(string, target) {
  return "0".repeat(target - string.length) + string;
}