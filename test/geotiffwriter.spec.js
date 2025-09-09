import { expect } from 'chai';
import { fromArrayBuffer, writeArrayBuffer } from '../src/geotiff.js';

it('should write and read back GeoDoubleParams keys (EPSG:4326)', async () => {
  const width = 2;
  const height = 2;
  const data = new Float32Array(width * height).fill(1);

  const metadata = {
    width,
    height,
    GeographicTypeGeoKey: 4326,
    GTModelTypeGeoKey: 2,
    GeogSemiMajorAxisGeoKey: 6378137.0, // DOUBLE
    GeogInvFlatteningGeoKey: 298.257223563, // DOUBLE
    GeogCitationGeoKey: 'WGS 84', // ASCII
    PCSCitationGeoKey: 'test-ascii', // ASCII
  };

  const buffer = await writeArrayBuffer(data, metadata);
  const tiff = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();

  const geoKeys = image.getGeoKeys();
  expect(geoKeys.GeogSemiMajorAxisGeoKey).to.be.closeTo(6378137.0, 0.000001);
  expect(geoKeys.GeogInvFlatteningGeoKey).to.be.closeTo(298.257223563, 0.000001);
  expect(geoKeys.GeogCitationGeoKey).to.equal('WGS 84');
  expect(geoKeys.PCSCitationGeoKey).to.equal('test-ascii');
});
