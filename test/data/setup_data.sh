set -e
wget https://github.com/EOxServer/autotest/raw/f8d9f4bde6686abbda09c711d4bf5239f5378aa9/autotest/data/meris/MER_FRS_1P_reduced/ENVISAT-MER_FRS_1PNPDE20060816_090929_000001972050_00222_23322_0058_uint16_reduced_compressed.tif -O initial.tiff
wget https://github.com/EOxServer/autotest/raw/f8d9f4bde6686abbda09c711d4bf5239f5378aa9/autotest/data/meris/mosaic_MER_FRS_1P_RGB_reduced/mosaic_ENVISAT-MER_FRS_1PNPDE20060816_090929_000001972050_00222_23322_0058_RGB_reduced.tif -O rgb.tiff
wget https://raw.githubusercontent.com/hubmapconsortium/portal-containers/master/containers/ome-tiff-offsets/test-input/multi-channel.ome.tif -O multi-channel.ome.tif

gdal_translate -of GTiff initial.tiff stripped.tiff
gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 stripped.tiff tiled.tiff
gdal_translate -of GTiff -ot Int32 stripped.tiff int32.tiff
gdal_translate -of GTiff -ot UInt32 stripped.tiff uint32.tiff
gdal_translate -of GTiff -ot Float32 stripped.tiff float32.tiff
gdal_translate -of GTiff -ot Float64 stripped.tiff float64.tiff
gdal_translate -of GTiff -co COMPRESS=LZW stripped.tiff lzw.tiff
gdal_translate -of GTiff -co COMPRESS=DEFLATE stripped.tiff deflate.tiff
gdal_translate -of GTiff -co COMPRESS=DEFLATE -co PREDICTOR=2 stripped.tiff deflate_predictor.tiff
gdal_translate -of GTiff -co COMPRESS=DEFLATE -co PREDICTOR=2 -co BLOCKYSIZE=128 stripped.tiff deflate_predictor_big_strips.tiff
gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co COMPRESS=DEFLATE -co PREDICTOR=2 stripped.tiff deflate_predictor_tiled.tiff
gdal_translate -of GTiff -co COMPRESS=PACKBITS stripped.tiff packbits.tiff
gdal_translate -of GTiff -co INTERLEAVE=BAND stripped.tiff interleave.tiff
gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co INTERLEAVE=BAND stripped.tiff tiledplanar.tiff
gdal_translate -of GTiff -co COMPRESS=LZW -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co INTERLEAVE=BAND stripped.tiff tiledplanarlzw.tiff
gdal_translate -of GTiff -co COMPRESS=LZW -ot Float64 stripped.tiff float64lzw.tiff
gdal_translate -of GTiff -co COMPRESS=LZW -co PREDICTOR=2 stripped.tiff lzw_predictor.tiff
gdal_translate -of GTiff -outsize 10% 10% stripped.tiff small.tiff
gdal_translate -of GTiff -co BIGTIFF=YES stripped.tiff bigtiff.tiff
gdal_translate -of GTiff -co COMPRESS=LERC -co MAX_Z_ERROR=1000 stripped.tiff lerc.tiff
gdal_translate -of GTiff -co COMPRESS=LERC -co MAX_Z_ERROR=1000 -co INTERLEAVE=BAND stripped.tiff lerc_interleave.tiff
gdal_translate -of GTiff -co COMPRESS=LERC_DEFLATE -co MAX_Z_ERROR=1000 stripped.tiff lerc_deflate.tiff
gdal_translate -of GTiff -co COMPRESS=LERC_ZSTD -co MAX_Z_ERROR=1000 stripped.tiff lerc_zstd.tiff
gdal_translate -of GTiff -ot Float32 -co COMPRESS=LERC -co MAX_Z_ERROR=1000 stripped.tiff float32lerc.tiff
gdal_translate -of GTiff -ot Float32 -co COMPRESS=LERC -co MAX_Z_ERROR=1000 -co INTERLEAVE=BAND stripped.tiff float32lerc_interleave.tiff
gdal_translate -of GTiff -ot Float32 -co COMPRESS=LERC_DEFLATE -co MAX_Z_ERROR=1000 stripped.tiff float32lerc_deflate.tiff
gdal_translate -of GTiff -ot Float32 -co COMPRESS=LERC_ZSTD -co MAX_Z_ERROR=1000 stripped.tiff float32lerc_zstd.tiff

gdal_translate -of COG initial.tiff cog.tiff

# overviews
cp stripped.tiff overviews.tiff
gdaladdo overviews.tiff 2 4 8 16
cp stripped.tiff overviews_external.tiff
gdaladdo -ro overviews_external.tiff 2 4 8 16

# bigtiff
wget http://www.awaresystems.be/imaging/tiff/bigtiff/BigTIFFSamples.zip
unzip -o BigTIFFSamples.zip -d .
rm BigTIFFSamples.zip

# color images
rgb2pct.py rgb.tiff rgb_paletted.tiff
# convert rgb.tiff -colorspace YCbCr ycbcr.tif
# rgb2ycbcr rgb.tiff ycbcr.tif -h 1 -v 1
gdal_translate -co PHOTOMETRIC=YCBCR -co COMPRESS=JPEG -co JPEG_QUALITY=100 rgb.tiff ycbcr.tif
convert rgb.tiff -colorspace CMYK cmyk.tif
convert rgb.tiff -colorspace Lab cielab.tif

gdal_translate -of GTiff -co COMPRESS=JPEG rgb.tiff jpeg.tiff
gdal_translate -of GTiff -co COMPRESS=JPEG -co PHOTOMETRIC=YCBCR rgb.tiff jpeg_ycbcr.tiff

# modeltransformation tag
#wget https://s3.amazonaws.com/wdt-external/no_pixelscale_or_tiepoints.tiff

# RGBA example
wget https://s3.eu-central-1.amazonaws.com/waterview.geotiff/RGBA.tiff

# special LZW file
wget https://github.com/geotiffjs/geotiff.js/files/4186628/nasa_raster.tiff.zip
unzip -o nasa_raster.tiff.zip -d .

# additional test for LZW: EOI_CODE after CLEAR_CODE
wget https://github.com/geotiffjs/geotiff.js/files/2378479/lzw.zip
mkdir -p lzw_clear_eoi
unzip -o lzw.zip -d lzw_clear_eoi

# n-bit support

for i in 10 11 12 13 14 15; do
    gdal_translate -of GTiff -co NBITS=$i -ot UInt16 initial.tiff n_bit_${i}.tiff || true
    gdal_translate -of GTiff -co NBITS=$i -co TILED=YES -ot UInt16 initial.tiff n_bit_tiled_${i}.tiff || true
    gdal_translate -of GTiff -co NBITS=$i -ot UInt16 -co INTERLEAVE=BAND initial.tiff n_bit_interleave_${i}.tiff || true
done

gdal_translate -of GTiff -co NBITS=16 -ot Float32 initial.tiff float_n_bit_16.tiff || true
gdal_translate -of GTiff -co NBITS=16 -ot Float32 -co TILED=YES initial.tiff float_n_bit_tiled_16.tiff || true
gdal_translate -of GTiff -co NBITS=16 -ot Float32 -co INTERLEAVE=BAND initial.tiff float_n_bit_interleave_16.tiff || true

# GDAL_METADATA support
wget https://github.com/GeoTIFF/test-data/archive/6ec42abc044a6884037c148d67a87a5d28228ce5.zip -O geotiff-test-data.zip
unzip -j -o geotiff-test-data.zip "test-data-*/files/*" -d .
rm geotiff-test-data.zip

# add top-level metadata to a tiff for testing purposes
gdal_edit.py -mo DATUM=WGS84 wind_direction.tif
