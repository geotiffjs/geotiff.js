import GeoTIFF from '../src/geotiff'

const imageWindow = [0, 0, 500, 500];
const tiffs = [
  "stripped.tiff",
  "tiled.tiff",
  "tiledplanar.tiff",
  "float32.tiff",
  "uint32.tiff",
  "int32.tiff",
  "float64.tiff",
  "lzw.tiff",
  "tiledplanarlzw.tiff",
  "float64lzw.tiff",
  "lzw_predictor.tiff",
  "deflate.tiff",
  "deflate_predictor.tiff",
  "deflate_predictor_tiled.tiff",
];

const rgbtiffs = [
  "stripped.tiff",
  "rgb.tiff",
  "BigTIFF.tif",
  "rgb_paletted.tiff",
  "cmyk.tif",
  "ycbcr.tif",
  "cielab.tif",
  "5ae862e00b093000130affda.tif",
  "jpeg.tiff",
  "jpeg_ycbcr.tiff",
]

const pool = new GeoTIFF.Pool();
const bandsSelect = document.getElementById("bands");
for (let i = 0; i < 15; ++i) {
  const option = document.createElement("option");
  option.value = i;
  option.text = i + 1;
  bandsSelect.appendChild(option);
}

tiffs.forEach(function (filename) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/' + filename, true);
  xhr.responseType = 'arraybuffer';

  const div = document.createElement("div");
  div.style.float = "left";
  const header = document.createElement("p");
  header.innerHTML = filename;

  const canvas = document.createElement("canvas");
  canvas.id = filename;
  canvas.width = 500;
  canvas.height = 500;

  div.appendChild(header);
  div.appendChild(canvas);

  document.getElementById("canvases").appendChild(div);

  xhr.onload = function (e) {
    console.time("readRasters " + filename);
    GeoTIFF.fromArrayBuffer(this.response)
      .then(parser => parser.getImage())
      .then((image) => {
        // console.log(image);
        // console.log(image.getTiePoints());

        // var imageWindow = null;
        let width = image.getWidth();
        let height = image.getHeight();
        if (imageWindow) {
          width = imageWindow[2] - imageWindow[0];
          height = imageWindow[3] - imageWindow[1];
        }

        let plot;
        bandsSelect.addEventListener("change", function (e) {
          image.readRasters({ samples: [parseInt(bandsSelect.options[bandsSelect.selectedIndex].value)], poolSize: 8 })
            .then(function (rasters) {
              const canvas = document.getElementById(filename);
              plot = new plotty.plot(canvas, rasters[0], width, height, [10, 65000], "viridis", false);
              plot.render();
            });
        });
        image.readRasters({
          samples: [0],
          window: imageWindow,
          fillValue: 0,
          pool,
        })
          .then(function (rasters) {
            console.timeEnd("readRasters " + filename);
            const canvas = document.getElementById(filename);
            plot = new plotty.plot(canvas, rasters[0], width, height, [10, 65000], "viridis", false);
            plot.render();
          });
      });
  };
  xhr.send();
});

rgbtiffs.forEach(function (filename) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/' + filename, true);
  xhr.responseType = 'arraybuffer';

  const div = document.createElement("div");
  div.style.float = "left";
  const header = document.createElement("p");
  header.innerHTML = filename;

  const canvas = document.createElement("canvas");
  canvas.id = filename;
  div.appendChild(header);
  div.appendChild(canvas);
  document.getElementById("canvases").appendChild(div);

  xhr.onload = function (e) {
    GeoTIFF.fromArrayBuffer(this.response)
      .then(parser => parser.getImage())
      .then((image) => {
        console.time("readRGB " + filename);
        image.readRGB({ pool }).then(function (raster) {
          console.timeEnd("readRGB " + filename);
          canvas.width = image.getWidth();
          canvas.height = image.getHeight();
          const ctx = canvas.getContext("2d");
          const imageData = ctx.createImageData(image.getWidth(), image.getHeight());
          const data = imageData.data;
          let o = 0;
          for (var i = 0; i < raster.length; i += 3) {
            data[o] = raster[i];
            data[o + 1] = raster[i + 1];
            data[o + 2] = raster[i + 2];
            data[o + 3] = 255;
            o += 4;
          }
          ctx.putImageData(imageData, 0, 0);
        });
      });
  };
  xhr.send();
});
