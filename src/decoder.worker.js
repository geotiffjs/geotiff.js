import { getDecoder } from './compression';

async function decode(fileDirectory, buffer) {
  const decoder = getDecoder(fileDirectory);
  const decoded = await decoder.decode(fileDirectory, buffer);
  return decoded;
}

addEventListener('message', e => {
  const [name, ...args] = e.data;
  if (name === 'decode') {
    decode(...args).then(res => postMessage(res, [res]));
  }
});
