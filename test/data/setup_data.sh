wget https://github.com/EOxServer/autotest/raw/f8d9f4bde6686abbda09c711d4bf5239f5378aa9/autotest/data/meris/MER_FRS_1P_reduced/ENVISAT-MER_FRS_1PNPDE20060816_090929_000001972050_00222_23322_0058_uint16_reduced_compressed.tif -O initial.tiff
wget https://github.com/EOxServer/autotest/raw/f8d9f4bde6686abbda09c711d4bf5239f5378aa9/autotest/data/meris/mosaic_MER_FRS_1P_RGB_reduced/mosaic_ENVISAT-MER_FRS_1PNPDE20060816_090929_000001972050_00222_23322_0058_RGB_reduced.tif -O rgb.tiff
gdal_translate -of GTiff initial.tiff stripped.tiff
gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 stripped.tiff tiled.tiff
gdal_translate -of GTiff -ot Int32 stripped.tiff int32.tiff
gdal_translate -of GTiff -ot UInt32 stripped.tiff uint32.tiff
gdal_translate -of GTiff -ot Float32 stripped.tiff float32.tiff
gdal_translate -of GTiff -ot Float64 stripped.tiff float64.tiff
gdal_translate -of GTiff -co COMPRESS=LZW stripped.tiff lzw.tiff
gdal_translate -of GTiff -co COMPRESS=DEFLATE stripped.tiff deflate.tiff
gdal_translate -of GTiff -co COMPRESS=DEFLATE -co PREDICTOR=2 stripped.tiff deflate_predictor.tiff
gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co COMPRESS=DEFLATE -co PREDICTOR=2 stripped.tiff deflate_predictor_tiled.tiff
gdal_translate -of GTiff -co COMPRESS=PACKBITS stripped.tiff packbits.tiff
gdal_translate -of GTiff -co INTERLEAVE=BAND stripped.tiff interleave.tiff
gdal_translate -of GTiff -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co INTERLEAVE=BAND stripped.tiff tiledplanar.tiff
gdal_translate -of GTiff -co COMPRESS=LZW -co TILED=YES -co BLOCKXSIZE=32 -co BLOCKYSIZE=32 -co INTERLEAVE=BAND stripped.tiff tiledplanarlzw.tiff
gdal_translate -of GTiff -co COMPRESS=LZW -ot Float64 stripped.tiff float64lzw.tiff
gdal_translate -of GTiff -co COMPRESS=LZW -co PREDICTOR=2 stripped.tiff lzw_predictor.tiff
gdal_translate -of GTiff -outsize 10% 10% stripped.tiff small.tiff
gdal_translate -of GTiff -co BIGTIFF=YES stripped.tiff bigtiff.tiff

# overviews
cp stripped.tiff overviews.tiff
gdaladdo overviews.tiff 2 4 8 16

# bigtiff
wget http://www.awaresystems.be/imaging/tiff/bigtiff/BigTIFFSamples.zip
unzip -o BigTIFFSamples.zip -d .
rm BigTIFFSamples.zip

# color images
rgb2pct.py rgb.tiff rgb_paletted.tiff
# convert rgb.tiff -colorspace YCbCr ycbcr.tif
rgb2ycbcr rgb.tiff ycbcr.tif -h 1 -v 1
convert rgb.tiff -colorspace CMYK cmyk.tif
convert rgb.tiff -colorspace Lab cielab.tif

gdal_translate -of GTiff -co COMPRESS=JPEG rgb.tiff jpeg.tiff
gdal_translate -of GTiff -co COMPRESS=JPEG -co PHOTOMETRIC=YCBCR rgb.tiff jpeg_ycbcr.tiff

# modeltransformation tag
wget https://s3.amazonaws.com/wdt-external/no_pixelscale_or_tiepoints.tiff

# RGBA example
wget https://s3.eu-central-1.amazonaws.com/waterview.geotiff/RGBA.tiff

# statistics
cp initial.tiff stats.tiff
gdal_edit.py -stats stats.tiff
