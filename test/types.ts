// Internal test of Typescript types.  Imports from src not dist.
// downstream TS users of geotiff should simply import the geotiff library and will get types along with the dist build

import GeoTIFF from '../src/geotiff';
import { strict as assert } from 'assert';
import { toArrayRecursively } from '../src/utils';

const originalValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const height = 3;
const width = 3;

async function main() {
    const metadata = {
        "ImageWidth": width,
        "ImageLength": height,
        "BitsPerSample": [8],
        "Compression": 1, //no compression
        "PhotometricInterpretation": 2,
        "StripOffsets": [1054],
        "SamplesPerPixel": 1,
        "RowsPerStrip": [height],
        "StripByteCounts": [width * height],
        "PlanarConfiguration": 1,
        "SampleFormat": [1],
        "ModelPixelScale": [0.031355, 0.031355, 0],
        "ModelTiepoint": [0, 0, 0, 11.331755000000001, 46.268645, 0],
        "GeoKeyDirectory": [1, 1, 0, 5, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2049, 34737, 7, 0, 2054, 0, 1, 9102],
        "GeoAsciiParams": "WGS 84",
        "GTModelTypeGeoKey": 2,
        "GTRasterTypeGeoKey": 1,
        "GeographicTypeGeoKey": 4326,
        "GeogCitationGeoKey": "WGS 84",
        "GDAL_NODATA": "0",
      }
    const newGeoTiffAsBinaryData = await GeoTIFF.writeArrayBuffer(originalValues, metadata);
    const newGeoTiff = await GeoTIFF.fromArrayBuffer(newGeoTiffAsBinaryData);
    const image = await newGeoTiff.getImage();
    const rasters = await image.readRasters();
    const newValues = toArrayRecursively(rasters[0]);
    assert(JSON.stringify(newValues.slice(0,-1)) === JSON.stringify(originalValues.slice(0,-1)));
    console.log(newValues)
}

main()
