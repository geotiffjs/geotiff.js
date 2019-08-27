/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */

import { expect } from 'chai';
import 'isomorphic-fetch';

import { writeArrayBuffer } from '../src/entry-node';
import { chunk, toArray, toArrayRecursively, range } from '../src/utils';


function createSource(filename) {
  return fromFile(`test/data/${filename}`);
}

function normalize(input) {
  return JSON.stringify(toArrayRecursively(input));
}

describe("writeTests", () => {
  it("should write pixel values and metadata with sensible defaults", async () => {

    const originalValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const metadata = {
      height: 3,
      width: 3,
    };

    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);

    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);

    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();

    const newValues = toArrayRecursively(rasters[0]);

    expect(JSON.stringify(newValues.slice(0, -1))).to.equal(JSON.stringify(originalValues.slice(0, -1)));

    const geoKeys = image.getGeoKeys();
    expect(geoKeys).to.be.an('object');
    expect(geoKeys.GTModelTypeGeoKey).to.equal(2);
    expect(geoKeys.GTRasterTypeGeoKey).to.equal(1);
    expect(geoKeys.GeographicTypeGeoKey).to.equal(4326);
    expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');

    const fileDirectory = newGeoTiff.fileDirectories[0][0];
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal("WGS 84\u0000");
    expect(fileDirectory.ImageLength).to.equal(3);
    expect(fileDirectory.ImageWidth).to.equal(3);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(1);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal("[1000]"); //hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(1);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(3));
    expect(normalize(fileDirectory.StripByteCounts)).to.equal(normalize(metadata.StripByteCounts));
  });

  it("should write rgb data with sensible defaults", async () => {
    const originalRed = [
      [ 255, 255, 255 ],
      [ 0, 0, 0 ],
      [ 0, 0, 0 ]
    ];

    const originalGreen = [
      [ 0, 0, 0 ],
      [ 255, 255, 255 ],
      [ 0, 0, 0 ]
    ];

    const originalBlue = [
      [ 0, 0, 0 ],
      [ 0, 0, 0 ],
      [ 255, 255, 255 ]
    ];

    const originalValues = [originalRed, originalGreen, originalBlue];

    const metadata = {
      height: 3,
      width: 3,
    };

    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);

    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);

    const image = await newGeoTiff.getImage();
    const newValues = await image.readRasters();
    const red = chunk(newValues[0], 3);
    const green = chunk(newValues[1], 3);
    const blue = chunk(newValues[2], 3);

    expect(normalize(red)).to.equal(normalize(originalRed));
    expect(normalize(green)).to.equal(normalize(originalGreen));
    expect(normalize(blue)).to.equal(normalize(originalBlue));

    const geoKeys = image.getGeoKeys();
    expect(geoKeys).to.be.an("object");
    expect(geoKeys.GTModelTypeGeoKey).to.equal(2);
    expect(geoKeys.GTRasterTypeGeoKey).to.equal(1);
    expect(geoKeys.GeographicTypeGeoKey).to.equal(4326);
    expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');

    const fileDirectory = newGeoTiff.fileDirectories[0][0];
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8,8,8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal("WGS 84\u0000");
    expect(fileDirectory.ImageLength).to.equal(3);
    expect(fileDirectory.ImageWidth).to.equal(3);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(2);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal("[1000]"); //hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1, 1, 1 ]));
    expect(fileDirectory.SamplesPerPixel).to.equal(3);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(3));
    expect(toArray(fileDirectory.StripByteCounts).toString()).to.equal("27");
  });

  it("should write flattened pixel values", async () => {

    const originalValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const height = 3;
    const width = 3;

    const metadata = getMockMetaData(height, width);

    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);

    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);

    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();

    const newValues = toArrayRecursively(rasters[0]);

    expect(JSON.stringify(newValues.slice(0, -1))).to.equal(JSON.stringify(originalValues.slice(0, -1)));
  });

  it("should write pixel values in two dimensions", async () => {
    const originalValues = [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    ];

    const height = 3;
    const width = 3;

    const metadata = getMockMetaData(height, width);

    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);

    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const newValues = await image.readRasters();
    const newValuesReshaped = toArray(newValues).map(function (band) {
      return chunk(band, width);
    });

    expect(JSON.stringify(newValuesReshaped.slice(0, -1))).to.equal(JSON.stringify(originalValues.slice(0, -1)));
  });


  it("should write metadata correctly", async () => {
    const height = 12;
    const width = 12;
    const originalValues = range(height * width);

    const metadata = getMockMetaData(height, width);

    const newGeoTiffAsBinaryData = await writeArrayBuffer(originalValues, metadata);

    const newGeoTiff = await fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);

    expect(JSON.stringify(newValues.slice(0, -1))).to.equal(JSON.stringify(originalValues.slice(0, -1)));

    const fileDirectory = newGeoTiff.fileDirectories[0][0];
    expect(normalize(fileDirectory.BitsPerSample)).to.equal(normalize([8]));
    expect(fileDirectory.Compression).to.equal(1);
    expect(fileDirectory.GeoAsciiParams).to.equal("WGS 84\u0000");
    expect(fileDirectory.ImageLength).to.equal(height);
    expect(fileDirectory.ImageWidth).to.equal(width);
    expect(normalize(fileDirectory.ModelPixelScale)).to.equal(normalize(metadata.ModelPixelScale));
    expect(normalize(fileDirectory.ModelTiepoint)).to.equal(normalize(metadata.ModelTiepoint));
    expect(fileDirectory.PhotometricInterpretation).to.equal(2);
    expect(fileDirectory.PlanarConfiguration).to.equal(1);
    expect(normalize(fileDirectory.StripOffsets)).to.equal("[1000]"); //hardcoded at 2000 now rather than calculated
    expect(normalize(fileDirectory.SampleFormat)).to.equal(normalize([1]));
    expect(fileDirectory.SamplesPerPixel).to.equal(1);
    expect(normalize(fileDirectory.RowsPerStrip)).to.equal(normalize(height));
    expect(normalize(fileDirectory.StripByteCounts)).to.equal(normalize(metadata.StripByteCounts));
    expect(fileDirectory.GDAL_NODATA).to.equal("0\u0000");
  });
});
