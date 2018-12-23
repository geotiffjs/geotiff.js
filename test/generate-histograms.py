from collections import Counter
import json
import numpy as np
import rasterio as rio
from sys import argv

def getHistogram(filepath):
  with rio.open(filepath) as src:
    bands = src.read()
    counts = Counter()
    for row in bands[0]:
      counts.update(row)
  cleaned = dict([(int(key), value) for key, value in counts.items()])
  return cleaned

histograms = {}
for n in range(1, 33):
  histograms[n] = getHistogram('data/' + str(n) + '-bit-stripped.tif')
print(json.dumps(histograms))