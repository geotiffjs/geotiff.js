from collections import Counter
import json
import numpy as np
from os import listdir
from os.path import join
import rasterio as rio
from sys import argv

def getHistograms(filepath, window=None):
  histograms = {}
  with rio.open(filepath) as src:
    bands = src.read()
    for bandindex, band in enumerate(bands):
      counts = Counter()
      if window:
        left, top, right, bottom = window
        for row in band[top:bottom]:
          counts.update(row[left:right])
      else:
        for row in band:
          counts.update(row)
    cleaned = dict([(int(key), value) for key, value in counts.items()])
    histograms[bandindex] = cleaned
  return histograms

# generate histograms for performNBitTests
histograms = {}
for n in range(1, 33):
  histograms[n] = getHistograms('data/' + str(n) + '-bit-stripped.tif')

# generate histograms for performTiffTests
tiffs = [
  "stripped.tiff",
  "tiled.tiff",
  "interleave.tiff",
  "lzw.tiff",
  "tiledplanarlzw.tiff",
  "int32.tiff",
  "uint32.tiff",
  "float32.tiff",
  "float64.tiff",
  "float64lzw.tiff",
  "packbits.tiff",
  "bigtiff.tiff"
]
for filename in tiffs:
  filepath = join('data', filename)
  histograms[filename] = getHistograms(filepath, [200, 200, 210, 210])

# print results
print(json.dumps(histograms))

