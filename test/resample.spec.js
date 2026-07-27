import { expect } from 'chai';

import {
  resampleBilinear,
  resampleBilinearInterleaved,
} from '../src/resample.js';

describe('bilinear resampling', () => {
  it('aligns expanded rasters with the source grid endpoints', () => {
    const source = new Float64Array([
      0, 10,
      20, 30,
    ]);

    const [result] = resampleBilinear([source], 2, 2, 3, 3);

    expect(result).to.deep.equal(new Float64Array([
      0, 5, 10,
      10, 15, 20,
      20, 25, 30,
    ]));
  });

  it('aligns reduced rasters with the source grid endpoints', () => {
    const source = new Float64Array([
      0, 1, 2, 3,
      10, 11, 12, 13,
      20, 21, 22, 23,
      30, 31, 32, 33,
    ]);

    const [result] = resampleBilinear([source], 4, 4, 3, 3);

    expect(result).to.deep.equal(new Float64Array([
      0, 1.5, 3,
      15, 16.5, 18,
      30, 31.5, 33,
    ]));
  });

  it('aligns interleaved rasters with the source grid endpoints', () => {
    const source = new Float64Array([
      0, 100, 10, 110,
      20, 120, 30, 130,
    ]);

    const result = resampleBilinearInterleaved(source, 2, 2, 3, 3, 2);

    expect(result).to.deep.equal(new Float64Array([
      0, 100, 5, 105, 10, 110,
      10, 110, 15, 115, 20, 120,
      20, 120, 25, 125, 30, 130,
    ]));
  });

  it('handles single-pixel output dimensions', () => {
    const source = new Float64Array([
      1, 2,
      3, 4,
    ]);

    const [result] = resampleBilinear([source], 2, 2, 1, 1);

    expect(result).to.deep.equal(new Float64Array([1]));
  });
});
