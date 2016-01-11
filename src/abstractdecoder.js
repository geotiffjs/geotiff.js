export default class AbstractDecoder {
  isAsync() {
    // TODO: check if async reading func is enabled or not.
    return (!this.decodeBlock);
  }
}
