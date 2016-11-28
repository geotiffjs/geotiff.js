export function fromWhiteIsZero(raster, max, width, height) {
  const rgbRaster = new Uint8Array(width * height * 3);
  let value;
  for (let i = 0, j = 0; i < raster.length; ++i, j += 3) {
    value = 256 - (raster[i] / max * 256);
    rgbRaster[j] = value;
    rgbRaster[j + 1] = value;
    rgbRaster[j + 2] = value;
  }
  return rgbRaster;
}

export function fromBlackIsZero(raster, max, width, height) {
  const rgbRaster = new Uint8Array(width * height * 3);
  let value;
  for (let i = 0, j = 0; i < raster.length; ++i, j += 3) {
    value = raster[i] / max * 256;
    rgbRaster[j] = value;
    rgbRaster[j + 1] = value;
    rgbRaster[j + 2] = value;
  }
  return rgbRaster;
}

export function fromPalette(raster, colorMap, width, height) {
  const rgbRaster = new Uint8Array(width * height * 3);
  const greenOffset = colorMap.length / 3;
  const blueOffset = colorMap.length / 3 * 2;
  for (let i = 0, j = 0; i < raster.length; ++i, j += 3) {
    const mapIndex = raster[i];
    rgbRaster[j] = colorMap[mapIndex] / 65536 * 256;
    rgbRaster[j + 1] = colorMap[mapIndex + greenOffset] / 65536 * 256;
    rgbRaster[j + 2] = colorMap[mapIndex + blueOffset] / 65536 * 256;
  }
  return rgbRaster;
}

export function fromCMYK(cmykRaster, width, height) {
  const rgbRaster = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < cmykRaster.length; i += 4, j += 3) {
    const c = cmykRaster[i];
    const m = cmykRaster[i + 1];
    const y = cmykRaster[i + 2];
    const k = cmykRaster[i + 3];

    rgbRaster[j] = 255 * ((255 - c) / 256) * ((255 - k) / 256);
    rgbRaster[j + 1] = 255 * ((255 - m) / 256) * ((255 - k) / 256);
    rgbRaster[j + 2] = 255 * ((255 - y) / 256) * ((255 - k) / 256);
  }
  return rgbRaster;
}

export function fromYCbCr(yCbCrRaster, width, height) {
  const rgbRaster = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < yCbCrRaster.length; i += 3, j += 3) {
    const y = yCbCrRaster[i];
    const cb = yCbCrRaster[i + 1];
    const cr = yCbCrRaster[i + 2];

    rgbRaster[j] = (y + (1.40200 * (cr - 0x80)));
    rgbRaster[j + 1] = (y - (0.34414 * (cb - 0x80)) - (0.71414 * (cr - 0x80)));
    rgbRaster[j + 2] = (y + (1.77200 * (cb - 0x80)));
  }
  return rgbRaster;
}

// converted from here:
// http://de.mathworks.com/matlabcentral/fileexchange/24010-lab2rgb/content/Lab2RGB.m
// still buggy
/* eslint-disable */
export function fromCIELab(cieLabRaster, width, height) {
  const T1 = 0.008856;
  const T2 = 0.206893;
  const MAT = [3.240479, -1.537150, -0.498535,
              -0.969256,  1.875992,  0.041556,
               0.055648, -0.204043,  1.057311];
  const rgbRaster = new Uint8Array(width * height * 3);

  for (let i = 0, j = 0; i < cieLabRaster.length; i += 3, j += 3) {
    const L = cieLabRaster[i];
    const a = cieLabRaster[i + 1];
    const b = cieLabRaster[i + 2];

    // Compute Y
    let fY = Math.pow(((L + 16) / 116), 3);
    const YT = fY > T1;
    fY = ((YT !== 0) * (L / 903.3)) + (YT * fY);
    const Y = fY;

    fY = YT * Math.pow(fY, 1 / 3) + (YT !== 0) * (7.787 * fY + 16/116);

    // Compute X
    const fX = (a / 500) + fY;
    const XT = fX > T2;
    let X = ((XT * Math.pow(fX, 3)) + ((XT !== 0) * ((fX - (16 / 116)) / 7.787)));

    // Compute Z
    const fZ = fY - (b / 200);
    const ZT = fZ > T2;
    let Z = ((ZT * Math.pow(fZ, 3)) + ((ZT !== 0) * ((fZ - (16 / 116)) / 7.787)));

    // Normalize for D65 white point
    X *= 0.950456;
    Z *= 1.088754;

    rgbRaster[j] = (X * MAT[0]) + (Y * MAT[1]) + (Z * MAT[2]);
    rgbRaster[j + 1] = (X * MAT[3]) + (Y * MAT[4]) + (Z * MAT[5]);
    rgbRaster[j + 2] = (X * MAT[6]) + (Y * MAT[7]) + (Z * MAT[8]);
  }
  return rgbRaster;
}
/* eslint-enable */
