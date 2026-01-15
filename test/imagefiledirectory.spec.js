/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { ImageFileDirectory } from '../src/imagefiledirectory.js';
import { fieldTypes } from '../src/globals.js';

// Counter for unique test tags
let testTagCounter = 60000;

/**
 * Helper to create an IFD with a DeferredArray for testing.
 * Returns both the IFD and the tag number.
 */
async function createIFDWithDeferredArray(dataBuffer, arrayOffset, littleEndian, fieldType, length) {
  // Register a custom tag that will be treated as an array
  const { registerTag } = await import('../src/globals.js');
  const testTag = testTagCounter++;
  registerTag(testTag, `TestArrayTag${testTag}`, undefined, true);

  // Create a minimal IFD with a deferred array
  const { ImageFileDirectoryParser } = await import('../src/imagefiledirectory.js');

  // Write the IFD structure directly into the dataBuffer at offset 0
  const view = new DataView(dataBuffer);

  // Write minimal IFD header for non-BigTIFF
  view.setUint16(0, 1, true); // 1 entry

  // Write a field entry that references external data (> 4 bytes)
  view.setUint16(2, testTag, true); // tag
  view.setUint16(4, fieldType, true); // field type
  view.setUint32(6, length, true); // count
  view.setUint32(10, arrayOffset, true); // offset to data (must be external)

  view.setUint32(14, 0, true); // next IFD offset

  const mockSource = {
    fetch: async (ranges) => {
      const results = [];
      for (const range of ranges) {
        // Return the actual data from the provided buffer
        const slice = dataBuffer.slice(range.offset, range.offset + range.length);
        results.push(slice);
      }
      return results;
    },
  };

  const parser = new ImageFileDirectoryParser(mockSource, littleEndian, false, false);
  const ifd = await parser.parseFileDirectoryAt(0);

  return { ifd, tag: testTag };
}

describe('DeferredArray (tested through IFD)', () => {
  it('should lazily load indexed values from deferred arrays', async () => {
    // Create a buffer with LONG values
    // Note: for LONG (4 bytes), need at least 2 values to exceed inline storage (4 bytes)
    // Also need offset beyond initial 1024-byte fetch window
    const buffer = new ArrayBuffer(3000);
    const view = new DataView(buffer);
    const offset = 2000;

    // Write some test values
    for (let i = 0; i < 10; i++) {
      view.setUint32(offset + (i * 4), (i + 1) * 100, true);
    }

    const { ifd, tag } = await createIFDWithDeferredArray(buffer, offset, true, fieldTypes.LONG, 10);

    // Verify it's a deferred array
    expect(ifd.deferredArrays.has(tag)).to.be.true;

    // Load individual values
    const value1 = await ifd.loadValueIndexed(tag, 0);
    const value2 = await ifd.loadValueIndexed(tag, 5);
    const value3 = await ifd.loadValueIndexed(tag, 9);

    expect(value1).to.equal(100);
    expect(value2).to.equal(600);
    expect(value3).to.equal(1000);
  });

  it('should load all values at once', async () => {
    const buffer = new ArrayBuffer(3000);
    const view = new DataView(buffer);
    const offset = 2000;

    // Write test values (need >4 bytes total, so 5 LONGs = 20 bytes)
    for (let i = 0; i < 5; i++) {
      view.setUint32(offset + (i * 4), i * 10, true);
    }

    const { ifd, tag } = await createIFDWithDeferredArray(buffer, offset, true, fieldTypes.LONG, 5);

    // Load all values
    const values = await ifd.loadValue(tag);

    expect(values).to.be.an.instanceof(Uint32Array);
    expect(values).to.have.lengthOf(5);
    expect(Array.from(values)).to.deep.equal([0, 10, 20, 30, 40]);
  });

  it('should handle concurrent indexed access correctly', async () => {
    const buffer = new ArrayBuffer(3000);
    const view = new DataView(buffer);
    const offset = 2000;

    // SHORT is 2 bytes, need >4 bytes, so 10 SHORTs = 20 bytes
    for (let i = 0; i < 10; i++) {
      view.setUint16(offset + (i * 2), i * 5, true);
    }

    const { ifd, tag } = await createIFDWithDeferredArray(buffer, offset, true, fieldTypes.SHORT, 10);

    // Access multiple indices concurrently
    const [v1, v2, v3, v4] = await Promise.all([
      ifd.loadValueIndexed(tag, 0),
      ifd.loadValueIndexed(tag, 3),
      ifd.loadValueIndexed(tag, 7),
      ifd.loadValueIndexed(tag, 9),
    ]);

    expect(v1).to.equal(0);
    expect(v2).to.equal(15);
    expect(v3).to.equal(35);
    expect(v4).to.equal(45);
  });

  it('should work with different field types', async () => {
    // Test BYTE (1 byte each, need >4 bytes, so 10 bytes)
    const byteBuffer = new ArrayBuffer(3000);
    const byteView = new DataView(byteBuffer);
    const byteOffset = 1000;
    for (let i = 0; i < 10; i++) {
      byteView.setUint8(byteOffset + i, i + 1);
    }
    const { ifd: ifdByte, tag: tagByte } = await createIFDWithDeferredArray(
      byteBuffer,
      byteOffset,
      true,
      fieldTypes.BYTE,
      10,
    );
    const byteValues = await ifdByte.loadValue(tagByte);
    expect(byteValues).to.be.an.instanceof(Uint8Array);
    expect(byteValues[0]).to.equal(1);
    expect(byteValues[9]).to.equal(10);

    // Test FLOAT (4 bytes each, need >4 bytes, so 5 floats = 20 bytes)
    const floatBuffer = new ArrayBuffer(3000);
    const floatView = new DataView(floatBuffer);
    const floatOffset = 1000;
    for (let i = 0; i < 5; i++) {
      floatView.setFloat32(floatOffset + (i * 4), i * 1.5, true);
    }
    const { ifd: ifdFloat, tag: tagFloat } = await createIFDWithDeferredArray(
      floatBuffer,
      floatOffset,
      true,
      fieldTypes.FLOAT,
      5,
    );
    const floatValues = await ifdFloat.loadValue(tagFloat);
    expect(floatValues).to.be.an.instanceof(Float32Array);
    expect(floatValues[2]).to.be.closeTo(3.0, 0.001);
  });

  it('should cache values after loading', async () => {
    const buffer = new ArrayBuffer(3000);
    const view = new DataView(buffer);
    const offset = 2000;
    view.setUint32(offset, 42, true);
    view.setUint32(offset + 4, 84, true);

    const { ifd, tag } = await createIFDWithDeferredArray(buffer, offset, true, fieldTypes.LONG, 10);

    // Access the same index multiple times
    const v1 = await ifd.loadValueIndexed(tag, 0);
    const v2 = await ifd.loadValueIndexed(tag, 0);
    const v3 = await ifd.loadValueIndexed(tag, 0);

    expect(v1).to.equal(42);
    expect(v2).to.equal(42);
    expect(v3).to.equal(42);

    // Access another index
    const v4 = await ifd.loadValueIndexed(tag, 1);
    expect(v4).to.equal(84);
  });

  it('should allow loadValue after individual indexed access', async () => {
    const buffer = new ArrayBuffer(3000);
    const view = new DataView(buffer);
    const offset = 2000;
    for (let i = 0; i < 8; i++) {
      view.setUint32(offset + (i * 4), i * 7, true);
    }

    const { ifd, tag } = await createIFDWithDeferredArray(buffer, offset, true, fieldTypes.LONG, 8);

    // Access individual values first
    const v1 = await ifd.loadValueIndexed(tag, 2);
    expect(v1).to.equal(14);

    // Then load all
    const allValues = await ifd.loadValue(tag);
    expect(allValues).to.be.an.instanceof(Uint32Array);
    expect(allValues[2]).to.equal(14);
    expect(allValues[0]).to.equal(0);
    expect(allValues[7]).to.equal(49);
  });

  it('should use loadValue data for subsequent indexed access', async () => {
    const buffer = new ArrayBuffer(3000);
    const view = new DataView(buffer);
    const offset = 2000;
    for (let i = 0; i < 6; i++) {
      view.setUint32(offset + (i * 4), i * 11, true);
    }

    const { ifd, tag } = await createIFDWithDeferredArray(buffer, offset, true, fieldTypes.LONG, 6);

    // Load all first
    await ifd.loadValue(tag);

    // Then access indexed - should use cached data
    const v1 = await ifd.loadValueIndexed(tag, 3);
    const v2 = await ifd.loadValueIndexed(tag, 5);

    expect(v1).to.equal(33);
    expect(v2).to.equal(55);
  });
});

describe('ImageFileDirectory', () => {
  describe('getValue()', () => {
    it('should return undefined for non-existent tags', () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      const result = ifd.getValue(256);
      expect(result).to.be.undefined;
    });

    it('should return the value for actualized fields', () => {
      const actualizedFields = new Map([[256, 512]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = ifd.getValue(256);
      expect(result).to.equal(512);
    });

    it('should return the value for actualized fields using tag name', () => {
      const actualizedFields = new Map([[256, 512]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = ifd.getValue('ImageWidth');
      expect(result).to.equal(512);
    });

    it('should throw an error for deferred fields', () => {
      const deferredFields = new Map([[256, async () => 512]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      expect(() => ifd.getValue(256)).to.throw(
        Error,
        /Field '.*' \(256\) is deferred/,
      );
    });

    it('should throw an error for deferred arrays', () => {
      const mockDeferredArray = {
        loadAll: async () => [1, 2, 3],
        get: async (index) => index + 1,
      };
      const deferredArrays = new Map([[324, mockDeferredArray]]);
      const ifd = new ImageFileDirectory(new Map(), new Map(), deferredArrays, 0);
      expect(() => ifd.getValue(324)).to.throw(
        Error,
        /Field '.*' \(324\) is deferred/,
      );
    });

    it('should return array values', () => {
      const actualizedFields = new Map([[256, [1, 2, 3, 4]]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = ifd.getValue(256);
      expect(result).to.deep.equal([1, 2, 3, 4]);
    });

    it('should return string values', () => {
      const actualizedFields = new Map([[270, 'Test Description']]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = ifd.getValue(270);
      expect(result).to.equal('Test Description');
    });
  });

  describe('loadValue()', () => {
    it('should return undefined for non-existent tags', async () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      const result = await ifd.loadValue(256);
      expect(result).to.be.undefined;
    });

    it('should return the value for actualized fields', async () => {
      const actualizedFields = new Map([[256, 512]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = await ifd.loadValue(256);
      expect(result).to.equal(512);
    });

    it('should load and return value for deferred fields', async () => {
      const deferredFields = new Map([[256, async () => 512]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      const result = await ifd.loadValue(256);
      expect(result).to.equal(512);
      // Verify the field was moved to actualized
      expect(ifd.actualizedFields.has(256)).to.be.true;
      expect(ifd.actualizedFields.get(256)).to.equal(512);
      expect(ifd.deferredFields.has(256)).to.be.false;
    });

    it('should load and return value for deferred arrays', async () => {
      const mockDeferredArray = {
        loadAll: async () => [1, 2, 3],
        get: async (index) => index + 1,
      };
      const deferredArrays = new Map([[324, mockDeferredArray]]);
      const ifd = new ImageFileDirectory(new Map(), new Map(), deferredArrays, 0);
      const result = await ifd.loadValue(324);
      expect(result).to.deep.equal([1, 2, 3]);
    });

    it('should handle concurrent calls to loadValue for the same tag', async () => {
      let loadCount = 0;
      const deferredFields = new Map([[256, async () => {
        loadCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 512;
      }]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);

      // Call loadValue multiple times concurrently
      const [result1, result2, result3] = await Promise.all([
        ifd.loadValue(256),
        ifd.loadValue(256),
        ifd.loadValue(256),
      ]);

      expect(result1).to.equal(512);
      expect(result2).to.equal(512);
      expect(result3).to.equal(512);
      // Verify the loader function was only called once
      expect(loadCount).to.equal(1);
    });

    it('should handle errors during deferred field loading', async () => {
      const deferredFields = new Map([[256, async () => {
        throw new Error('Load failed');
      }]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);

      await expect(ifd.loadValue(256)).to.be.rejectedWith('Load failed');
      // Verify the tag is cleaned up after error
      expect(ifd.deferredFields.has(256)).to.be.false;
      expect(ifd.deferredFieldsBeingResolved.has(256)).to.be.false;
    });

    it('should work with tag names', async () => {
      const deferredFields = new Map([[256, async () => 512]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      const result = await ifd.loadValue('ImageWidth');
      expect(result).to.equal(512);
    });

    it('should return complex values like arrays', async () => {
      const deferredFields = new Map([[256, async () => [1, 2, 3, 4]]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      const result = await ifd.loadValue(256);
      expect(result).to.deep.equal([1, 2, 3, 4]);
    });

    it('should return typed arrays', async () => {
      const expectedArray = new Uint32Array([100, 200, 300]);
      const deferredFields = new Map([[256, async () => expectedArray]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      const result = await ifd.loadValue(256);
      expect(result).to.deep.equal(expectedArray);
    });
  });

  describe('loadValueIndexed()', () => {
    it('should return undefined for non-existent tags', async () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      const result = await ifd.loadValueIndexed(256, 0);
      expect(result).to.be.undefined;
    });

    it('should return indexed value for actualized array fields', async () => {
      const actualizedFields = new Map([[256, [10, 20, 30, 40]]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = await ifd.loadValueIndexed(256, 2);
      expect(result).to.equal(30);
    });

    it('should return indexed value for deferred arrays', async () => {
      const mockDeferredArray = {
        loadAll: async () => [1, 2, 3, 4, 5],
        get: async (index) => {
          const values = [1, 2, 3, 4, 5];
          return values[index];
        },
      };
      const deferredArrays = new Map([[324, mockDeferredArray]]);
      const ifd = new ImageFileDirectory(new Map(), new Map(), deferredArrays, 0);
      const result = await ifd.loadValueIndexed(324, 3);
      expect(result).to.equal(4);
    });

    it('should load and return indexed value for deferred fields', async () => {
      const deferredFields = new Map([[256, async () => [100, 200, 300, 400]]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      const result = await ifd.loadValueIndexed(256, 1);
      expect(result).to.equal(200);
    });

    it('should work with tag names', async () => {
      const actualizedFields = new Map([[256, [10, 20, 30, 40]]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = await ifd.loadValueIndexed('ImageWidth', 3);
      expect(result).to.equal(40);
    });

    it('should return indexed value from typed arrays', async () => {
      const actualizedFields = new Map([[256, new Uint32Array([100, 200, 300])]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = await ifd.loadValueIndexed(256, 1);
      expect(result).to.equal(200);
    });

    it('should handle out of bounds access gracefully for actualized fields', async () => {
      const actualizedFields = new Map([[256, [10, 20, 30]]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = await ifd.loadValueIndexed(256, 10);
      expect(result).to.be.undefined;
    });

    it('should handle string values by returning character at index', async () => {
      const actualizedFields = new Map([[270, 'TestString']]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const result = await ifd.loadValueIndexed(270, 4);
      expect(result).to.equal('S');
    });
  });

  describe('hasTag()', () => {
    it('should return false for non-existent tags', () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      expect(ifd.hasTag(256)).to.be.false;
    });

    it('should return true for actualized fields', () => {
      const actualizedFields = new Map([[256, 512]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      expect(ifd.hasTag(256)).to.be.true;
    });

    it('should return true for deferred fields', () => {
      const deferredFields = new Map([[256, async () => 512]]);
      const ifd = new ImageFileDirectory(new Map(), deferredFields, new Map(), 0);
      expect(ifd.hasTag(256)).to.be.true;
    });

    it('should return true for deferred arrays', () => {
      const mockDeferredArray = {
        loadAll: async () => [1, 2, 3],
        get: async (index) => index + 1,
      };
      const deferredArrays = new Map([[324, mockDeferredArray]]);
      const ifd = new ImageFileDirectory(new Map(), new Map(), deferredArrays, 0);
      expect(ifd.hasTag(324)).to.be.true;
    });

    it('should work with tag names', () => {
      const actualizedFields = new Map([[256, 512]]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      expect(ifd.hasTag('ImageWidth')).to.be.true;
    });
  });

  describe('toObject()', () => {
    it('should return empty object for empty IFD', () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      const obj = ifd.toObject();
      expect(obj).to.deep.equal({});
    });

    it('should convert actualized fields to object', () => {
      const actualizedFields = new Map([
        [256, 512],
        [257, 1024],
        [270, 'Test Description'],
      ]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const obj = ifd.toObject();
      expect(obj).to.have.property('ImageWidth', 512);
      expect(obj).to.have.property('ImageLength', 1024);
      expect(obj).to.have.property('ImageDescription', 'Test Description');
    });

    it('should not include deferred fields', () => {
      const actualizedFields = new Map([[256, 512]]);
      const deferredFields = new Map([[257, async () => 1024]]);
      const ifd = new ImageFileDirectory(actualizedFields, deferredFields, new Map(), 0);
      const obj = ifd.toObject();
      expect(obj).to.have.property('ImageWidth', 512);
      expect(obj).to.not.have.property('ImageLength');
    });

    it('should handle unknown tags', () => {
      const actualizedFields = new Map([[99999, 'Unknown Tag Value']]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const obj = ifd.toObject();
      expect(obj).to.have.property('Tag99999', 'Unknown Tag Value');
    });
  });

  describe('parseGeoKeyDirectory()', () => {
    it('should return null if GeoKeyDirectory tag does not exist', () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      const geoKeys = ifd.parseGeoKeyDirectory();
      expect(geoKeys).to.be.null;
    });

    it('should parse GeoKeyDirectory with scalar values', () => {
      // GeoKeyDirectory format: [Version, Revision, MinorRevision, NumKeys, ...]
      // Each key entry: [KeyID, TGIFFTagLocation, Count, Value_Offset]
      const actualizedFields = new Map([
        [34735, new Uint16Array([
          1, 1, 0, 2, // Header: version, revision, minor revision, 2 keys
          1024, 0, 1, 2, // GTModelTypeGeoKey = 2 (Geographic)
          1025, 0, 1, 1, // GTRasterTypeGeoKey = 1 (PixelIsArea)
        ])],
      ]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const geoKeys = ifd.parseGeoKeyDirectory();
      expect(geoKeys).to.have.property('GTModelTypeGeoKey', 2);
      expect(geoKeys).to.have.property('GTRasterTypeGeoKey', 1);
    });

    it('should parse GeoKeyDirectory with string references', () => {
      const actualizedFields = new Map([
        [34735, new Uint16Array([
          1, 1, 0, 1, // Header: 1 key
          1026, 34737, 12, 0, // GTCitationGeoKey references GeoAsciiParams at offset 0, count 12
        ])],
        [34737, 'Test String|'], // GeoAsciiParams
      ]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const geoKeys = ifd.parseGeoKeyDirectory();
      expect(geoKeys).to.have.property('GTCitationGeoKey', 'Test String');
    });

    it('should parse GeoKeyDirectory with array references', () => {
      const actualizedFields = new Map([
        [34735, new Uint16Array([
          1, 1, 0, 1, // Header: 1 key
          2048, 34736, 3, 0, // GeographicTypeGeoKey references GeoDoubleParams at offset 0, count 3
        ])],
        [34736, new Float64Array([1.5, 2.5, 3.5, 4.5])], // GeoDoubleParams
      ]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const geoKeys = ifd.parseGeoKeyDirectory();
      expect(geoKeys).to.have.property('GeographicTypeGeoKey');
      expect(geoKeys.GeographicTypeGeoKey).to.be.an.instanceof(Float64Array);
      expect(Array.from(geoKeys.GeographicTypeGeoKey)).to.deep.equal([1.5, 2.5, 3.5]);
    });

    it('should return single value for array with count 1', () => {
      const actualizedFields = new Map([
        [34735, new Uint16Array([
          1, 1, 0, 1, // Header: 1 key
          2048, 34736, 1, 0, // GeographicTypeGeoKey references GeoDoubleParams at offset 0, count 1
        ])],
        [34736, new Float64Array([4326])], // GeoDoubleParams
      ]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      const geoKeys = ifd.parseGeoKeyDirectory();
      expect(geoKeys).to.have.property('GeographicTypeGeoKey', 4326);
    });

    it('should throw error if referenced tag does not exist', () => {
      const actualizedFields = new Map([
        [34735, new Uint16Array([
          1, 1, 0, 1, // Header: 1 key
          1026, 34737, 5, 0, // GTCitationGeoKey references GeoAsciiParams (which doesn't exist)
        ])],
      ]);
      const ifd = new ImageFileDirectory(actualizedFields, new Map(), new Map(), 0);
      expect(() => ifd.parseGeoKeyDirectory()).to.throw(
        Error,
        /Could not get value of geoKey/,
      );
    });
  });

  describe('nextIFDByteOffset', () => {
    it('should store the nextIFDByteOffset', () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 1234);
      expect(ifd.nextIFDByteOffset).to.equal(1234);
    });

    it('should handle zero offset for last IFD', () => {
      const ifd = new ImageFileDirectory(new Map(), new Map(), new Map(), 0);
      expect(ifd.nextIFDByteOffset).to.equal(0);
    });
  });
});
