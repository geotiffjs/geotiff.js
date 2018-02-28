import { getDecoder } from './compression';

async function decode(self, compression, buffer) {
  const decoder = getDecoder(compression);
  decoder.decodeBlock(buffer)
    .then((result) => {
      self.postMessage([result], [result]);
    });
}

export default function (self) {
  self.addEventListener('message', (event) => {
    const [name, ...args] = event.data;
    switch (name) {
      case 'decode':
        decode(self, ...args);
        break;
      default:
        break;
    }
  });
}
