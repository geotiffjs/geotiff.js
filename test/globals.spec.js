/* eslint-disable global-require, no-unused-expressions */
import { expect } from 'chai';

import { registerTag, getTag, fieldTypes } from '../src/globals.js';

describe('registerTag()', () => {
  it('shall register simple tags', () => {
    registerTag(0xBEA1, 'TestTag');
    const tag = getTag(0xBEA1);
    expect(tag.tag).to.equal(0xBEA1);
    expect(tag.name).to.equal('TestTag');
    expect(tag.type).to.be.undefined;
    expect(tag.isArray).to.be.false;
    expect(tag.eager).to.be.false;
  });
  it('shall register tags with type', () => {
    registerTag(0xBEA2, 'TestTagRational', 'RATIONAL');
    const tag = getTag(0xBEA2);
    expect(tag.tag).to.equal(0xBEA2);
    expect(tag.name).to.equal('TestTagRational');
    expect(tag.type).to.equal(fieldTypes.RATIONAL);
    expect(tag.isArray).to.be.false;
    expect(tag.eager).to.be.false;
  });
  it('shall register tags with type name', () => {
    registerTag(0xBEA3, 'TestTagRational', fieldTypes.RATIONAL);
    const tag = getTag(0xBEA3);
    expect(tag.tag).to.equal(0xBEA3);
    expect(tag.name).to.equal('TestTagRational');
    expect(tag.type).to.equal(fieldTypes.RATIONAL);
    expect(tag.isArray).to.be.false;
    expect(tag.eager).to.be.false;
  });
  it('shall register array tags', () => {
    registerTag(0xBEA4, 'TestTagArray', undefined, true);
    const tag = getTag(0xBEA4);
    expect(tag.tag).to.equal(0xBEA4);
    expect(tag.name).to.equal('TestTagArray');
    expect(tag.type).to.undefined;
    expect(tag.isArray).to.be.true;
    expect(tag.eager).to.be.false;
  });
  it('shall register typed array tags', () => {
    registerTag(0xBEA5, 'TestTagArrayTyped', 'LONG', true);
    const tag = getTag(0xBEA5);
    expect(tag.tag).to.equal(0xBEA5);
    expect(tag.name).to.equal('TestTagArrayTyped');
    expect(tag.type).to.equal(fieldTypes.LONG);
    expect(tag.isArray).to.be.true;
    expect(tag.eager).to.be.false;
  });
});
