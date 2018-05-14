/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */

import isNode from 'detect-node';
import 'isomorphic-fetch';
import { expect } from 'chai';

import { makeFetchSource } from '../src/source';

const port = 9999;
let server = null;

before(() => {
  if (isNode) {
    const express = require('express');
    const app = express();
    app.use(express.static('.'));
    server = app.listen(9999);
  }
});

after(() => {
  if (server) {
    server.close();
  }
});


describe('makeFetchSource', () => {
  it('shall fetch the first n bytes', async () => {
    const blockSize = 512;
    const source = makeFetchSource(`http://localhost:${port}/test/data/stripped.tiff`, { blockSize });
    expect(source).to.be.ok;
    const response = await source.fetch(0, 10);
    expect(response.byteLength).to.equal(10);
    const firstBlock = source.blocks.get(0);
    expect(firstBlock).to.be.ok;
    expect(firstBlock.offset).to.equal(0);
    expect(firstBlock.length).to.equal(blockSize);
    expect(firstBlock.data.byteLength).to.equal(blockSize);
  });
});
