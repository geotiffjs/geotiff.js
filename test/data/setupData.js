const shell = require('shelljs');
const wget = require('node-wget');
var extract = require('extract-zip');

wget({
  url: 'https://github.com/EOxServer/autotest/raw/f8d9f4bde6686abbda09c711d4bf5239f5378aa9/autotest/data/meris/MER_FRS_1P_reduced/ENVISAT-MER_FRS_1PNPDE20060816_090929_000001972050_00222_23322_0058_uint16_reduced_compressed.tif',
  dest: 'initial.tiff',
});

wget({
  url: 'https://github.com/EOxServer/autotest/raw/f8d9f4bde6686abbda09c711d4bf5239f5378aa9/autotest/data/meris/mosaic_MER_FRS_1P_RGB_reduced/mosaic_ENVISAT-MER_FRS_1PNPDE20060816_090929_000001972050_00222_23322_0058_RGB_reduced.tif',
  dest: 'rgb.tiff',
});

shell.exec('gdal_translate -of GTiff initial.tiff stripped.tiff');
shell.exec('gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 stripped.tiff tiled.tiff');
shell.exec('gdal_translate -of GTiff -ot Int32 stripped.tiff int32.tiff');
shell.exec('gdal_translate -of GTiff -ot UInt32 stripped.tiff uint32.tiff');
shell.exec('gdal_translate -of GTiff -ot Float32 stripped.tiff float32.tiff');
shell.exec('gdal_translate -of GTiff -ot Float64 stripped.tiff float64.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=LZW stripped.tiff lzw.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=DEFLATE stripped.tiff deflate.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=DEFLATE -co PREDICTOR=2 stripped.tiff deflate_predictor.tiff');
shell.exec('gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co COMPRESS=DEFLATE -co PREDICTOR=2 stripped.tiff deflate_predictor_tiled.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=PACKBITS stripped.tiff packbits.tiff');
shell.exec('gdal_translate -of GTiff -co INTERLEAVE=BAND stripped.tiff interleave.tiff');
shell.exec('gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co INTERLEAVE=BAND stripped.tiff tiledplanar.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=LZW -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co INTERLEAVE=BAND stripped.tiff tiledplanarlzw.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=LZW -ot Float64 stripped.tiff float64lzw.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=LZW -co PREDICTOR=2 stripped.tiff lzw_predictor.tiff');
shell.exec('gdal_translate -of GTiff -outsize 10% 10% stripped.tiff small.tiff');
shell.exec('gdal_translate -of GTiff -co BIGTIFF=YES stripped.tiff bigtiff.tiff');


// overviews
shell.cp('stripped.tiff', 'overviews.tiff');
shell.exec('gdaladdo overviews.tiff 2 4 8 16');

// bigtiff
wget('http://www.awaresystems.be/imaging/tiff/bigtiff/BigTIFFSamples.zip');
extract('BigTIFFSamples.zip', {
  dir: __dirname,
},
function (err) { //eslint-disable-line
  console.log(err);
  shell.rm('BigTIFFSamples.zip');
},
);

// color images
shell.exec('rgb2pct.py rgb.tiff rgb_paletted.tiff');
shell.exec('rgb2ycbcr rgb.tiff ycbcr.tif -h 1 -v 1');
shell.exec('convert rgb.tiff -colorspace CMYK cmyk.tif');
shell.exec('convert rgb.tiff -colorspace Lab cielab.tif');

shell.exec('gdal_translate -of GTiff -co COMPRESS=JPEG rgb.tiff jpeg.tiff');
shell.exec('gdal_translate -of GTiff -co COMPRESS=JPEG -co PHOTOMETRIC=YCBCR rgb.tiff jpeg_ycbcr.tiff');


// modeltransformation tag
wget('https://s3.amazonaws.com/wdt-external/no_pixelscale_or_tiepoints.tiff');
