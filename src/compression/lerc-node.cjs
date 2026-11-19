/** @type {Promise<typeof import('lerc').decode> | undefined} */
let decoder;

async function load() {
  let lerc;
  try {
    lerc = await import('lerc');
  } catch (error) {
    // Lerc 4.3 ships ESM in a .js file without declaring its module type.
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    lerc = require('lerc');
  }
  await lerc.load();
  return lerc.decode;
}

module.exports = function loadLerc() {
  decoder ??= load();
  return decoder;
};
