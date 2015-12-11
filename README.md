# geotiff.js
[![Build Status](https://travis-ci.org/constantinius/geotiff.js.svg)](https://travis-ci.org/constantinius/geotiff.js) [![Dependency Status](https://www.versioneye.com/user/projects/566af91d4e049b0041000083/badge.svg?style=flat)](https://www.versioneye.com/user/projects/566af91d4e049b0041000083)

Read raw data from GeoTIFF files.

## Setup

To setup the repository do the following steps:

```bash
# clone repo
git clone https://github.com/constantinius/geotiff.js.git
cd geotiff.js/

# install development dependencies
npm install -g grunt-cli
npm install
```

## Testing and Building

To test the library (using PhantomJS, karma, mocha and chai) do the following:

```bash
grunt test
```

To do some in-browser testing do:

```bash
grunt serve
```

and navigate to `http://localhost:9000/test/`

To build the library do:

```bash
grunt
```

The output is written to `dist/geotiff.js` and `dist/geotiff.min.js`.

## Usage

geotiff.js works with both browserify style `require` and the global variable
`GeoTIFF`:

```javascript
var GeoTIFF = require("geotiff.js");
```

or:

```html
<script src="geotiff.js"></script>
<script>
    console.log(GeoTIFF);
</script>
```

To actually open a GeoTIFF image use the `parse` function. It works with both 
strings and `ArrayBuffers`:

```javascript
var tiff = GeoTIFF.parse(data);
```

Each TIFF file can be comprised of multiple "subfiles", containing the actual
raster data. To get the actual images, use the `getImage` method:

```javascript
var image = tiff.getImage(); // or use .getImage(n) where n is between 0 and
                             // tiff.getImageCount()

console.log(image.getWidth(), image.getHeight(), image.getSamplesPerPixel());
```

To actually read raster data the `readRasters` method does the job. It returns
an `Array` of `TypedArrays` for each of the requested samples of the requested
region:

```javascript
var window = [50, 50, 100, 100]; // left, top, right, bottom
var samples = [0, 1, 2, 3];
var rasters = image.readRasters(window, samples);

// to read all the complete rasters 
// var rasters = image.readRasters();

for (var i = 0; i < rasters.length; ++i) {
    console.log(rasters[i]);
}
```

To read TIFF or geo-spatial metadata, the methods `.getFileDirectory()` and
`.getGeoKeys()` provide the data:

```javascript
console.log(image.getFileDirectory(), image.getGeoKeys());
```

## What to do with the data?

There is a nice HTML 5/WebGL based rendering library called
[plotty](https://github.com/santilland/plotty), that allows for some really nice
on the fly rendering of the data contained in a GeoTIFF.

## TODO

* Implementation of various compression methods, like `Deflate`, `LZW` or
  `Packbits`
* Automatic reading of RGB(A) data
* Automatic reading of "Overviews", i.e: subfiles with reduced resolution
* Better support for geokeys