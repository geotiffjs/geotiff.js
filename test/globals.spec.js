/* eslint-disable global-require, no-unused-expressions */
import { expect } from 'chai';

import { registerTag, fieldTags, fieldTagNames, fieldTypes, arrayFields } from '../src/globals.js';

describe('registerTag()', () => {
  it('shall register simple tags', () => {
    registerTag(0xBEA1, 'TestTag');
    expect(fieldTags).to.have.property('TestTag');
    expect(fieldTagNames).to.have.property(String(0xBEA1));
    expect(fieldTypes).to.not.have.property('TestTag');
    expect(arrayFields).to.not.include(0xBEA1);
  });
  it('shall register tags with type', () => {
    registerTag(0xBEA2, 'TestTagRational', 'RATIONAL');
    expect(fieldTags).to.have.property('TestTagRational');
    expect(fieldTagNames).to.have.property(String(0xBEA2));
    expect(fieldTypes).to.have.property('TestTagRational');
    expect(arrayFields).to.not.include(0xBEA1);
  });
  it('shall register array tags', () => {
    registerTag(0xBEA3, 'TestTagArray', undefined, true);
    expect(fieldTags).to.have.property('TestTagArray');
    expect(fieldTagNames).to.have.property(String(0xBEA3));
    expect(fieldTypes).to.not.have.property('TestTagArray');
    expect(arrayFields).to.include(0xBEA3);
  });
  it('shall register typed array tags', () => {
    registerTag(0xBEA4, 'TestTagArrayTyped', 'LONG', true);
    expect(fieldTags).to.have.property('TestTagArrayTyped');
    expect(fieldTagNames).to.have.property(String(0xBEA4));
    expect(fieldTypes).to.have.property('TestTagArrayTyped');
    expect(arrayFields).to.include(0xBEA4);
  });
});
