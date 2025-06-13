// The contents of this file may be overridden for some build processes
import Worker from 'web-worker';

export default function create() {
  return new Worker(new URL('./decoder.js', import.meta.url), {
    type: 'module',
  });
}
