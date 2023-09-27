export default GeoTIFFImage;
export type ReadRasterOptions = {
    /**
     * window] the subset to read data from in pixels.
     */
    window?: number[] | undefined;
    /**
     * image] the subset to read data from in
     *      geographical coordinates.
     */
    bbox?: number[] | undefined;
    /**
     * samples] the selection of samples to read from. Default is all samples.
     */
    samples?: number[] | undefined;
    /**
     * whether the data shall be read
     *       in one single array or separate
     *       arrays.
     */
    interleave?: boolean | undefined;
    /**
     * The optional decoder pool to use.
     */
    pool?: any;
    /**
     * The desired width of the output. When the width is not the
     *       same as the images, resampling will be performed.
     */
    width?: number | undefined;
    /**
     * The desired height of the output. When the width is not the
     *       same as the images, resampling will be performed.
     */
    height?: number | undefined;
    /**
     * The desired resampling method.
     */
    resampleMethod?: string | undefined;
    /**
     * An AbortSignal that may be signalled if the request is
     *       to be aborted
     */
    signal?: AbortSignal | undefined;
    /**
     * The value to use for parts of the image
     *       outside of the images extent. When multiple
     *       samples are requested, an array of fill values
     *       can be passed.
     */
    fillValue?: number | number[] | undefined;
};
export type TypedArray = import("./geotiff.js").TypedArray;
export type ReadRasterResult = import("./geotiff.js").ReadRasterResult;
/**
 * GeoTIFF sub-file image.
 */
declare class GeoTIFFImage {
    /**
     * @constructor
     * @param {Object} fileDirectory The parsed file directory
     * @param {Object} geoKeys The parsed geo-keys
     * @param {DataView} dataView The DataView for the underlying file.
     * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
     * @param {Boolean} cache Whether or not decoded tiles shall be cached
     * @param {import('./source/basesource').BaseSource} source The datasource to read from
     */
    constructor(fileDirectory: any, geoKeys: any, dataView: DataView, littleEndian: boolean, cache: boolean, source: import('./source/basesource').BaseSource);
    fileDirectory: any;
    geoKeys: any;
    dataView: DataView;
    littleEndian: boolean;
    tiles: {} | null;
    isTiled: boolean;
    planarConfiguration: any;
    source: import("./source/basesource").BaseSource;
    /**
     * Returns the associated parsed file directory.
     * @returns {Object} the parsed file directory
     */
    getFileDirectory(): any;
    /**
     * Returns the associated parsed geo keys.
     * @returns {Object} the parsed geo keys
     */
    getGeoKeys(): any;
    /**
     * Returns the width of the image.
     * @returns {Number} the width of the image
     */
    getWidth(): number;
    /**
     * Returns the height of the image.
     * @returns {Number} the height of the image
     */
    getHeight(): number;
    /**
     * Returns the number of samples per pixel.
     * @returns {Number} the number of samples per pixel
     */
    getSamplesPerPixel(): number;
    /**
     * Returns the width of each tile.
     * @returns {Number} the width of each tile
     */
    getTileWidth(): number;
    /**
     * Returns the height of each tile.
     * @returns {Number} the height of each tile
     */
    getTileHeight(): number;
    getBlockWidth(): number;
    getBlockHeight(y: any): number;
    /**
     * Calculates the number of bytes for each pixel across all samples. Only full
     * bytes are supported, an exception is thrown when this is not the case.
     * @returns {Number} the bytes per pixel
     */
    getBytesPerPixel(): number;
    getSampleByteSize(i: any): number;
    getReaderForSample(sampleIndex: any): (byteOffset: number, littleEndian?: boolean | undefined) => number;
    getSampleFormat(sampleIndex?: number): any;
    getBitsPerSample(sampleIndex?: number): any;
    getArrayForSample(sampleIndex: any, size: any): Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
    /**
     * Returns the decoded strip or tile.
     * @param {Number} x the strip or tile x-offset
     * @param {Number} y the tile y-offset (0 for stripped images)
     * @param {Number} sample the sample to get for separated samples
     * @param {import("./geotiff").Pool|import("./geotiff").BaseDecoder} poolOrDecoder the decoder or decoder pool
     * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
     *                               to be aborted
     * @returns {Promise.<ArrayBuffer>}
     */
    getTileOrStrip(x: number, y: number, sample: number, poolOrDecoder: import("./geotiff").Pool | import("./geotiff").BaseDecoder, signal?: AbortSignal | undefined): Promise<ArrayBuffer>;
    /**
     * Internal read function.
     * @private
     * @param {Array} imageWindow The image window in pixel coordinates
     * @param {Array} samples The selected samples (0-based indices)
     * @param {TypedArray|TypedArray[]} valueArrays The array(s) to write into
     * @param {Boolean} interleave Whether or not to write in an interleaved manner
     * @param {import("./geotiff").Pool|AbstractDecoder} poolOrDecoder the decoder or decoder pool
     * @param {number} width the width of window to be read into
     * @param {number} height the height of window to be read into
     * @param {number} resampleMethod the resampling method to be used when interpolating
     * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
     *                               to be aborted
     * @returns {Promise<ReadRasterResult>}
     */
    private _readRaster;
    /**
     * Reads raster data from the image. This function reads all selected samples
     * into separate arrays of the correct type for that sample or into a single
     * combined array when `interleave` is set. When provided, only a subset
     * of the raster is read for each sample.
     *
     * @param {ReadRasterOptions} [options={}] optional parameters
     * @returns {Promise<ReadRasterResult>} the decoded arrays as a promise
     */
    readRasters({ window: wnd, samples, interleave, pool, width, height, resampleMethod, fillValue, signal, }?: ReadRasterOptions | undefined): Promise<ReadRasterResult>;
    /**
     * Reads raster data from the image as RGB. The result is always an
     * interleaved typed array.
     * Colorspaces other than RGB will be transformed to RGB, color maps expanded.
     * When no other method is applicable, the first sample is used to produce a
     * grayscale image.
     * When provided, only a subset of the raster is read for each sample.
     *
     * @param {Object} [options] optional parameters
     * @param {Array<number>} [options.window] the subset to read data from in pixels.
     * @param {boolean} [options.interleave=true] whether the data shall be read
     *                                             in one single array or separate
     *                                             arrays.
     * @param {import("./geotiff").Pool} [options.pool=null] The optional decoder pool to use.
     * @param {number} [options.width] The desired width of the output. When the width is no the
     *                                 same as the images, resampling will be performed.
     * @param {number} [options.height] The desired height of the output. When the width is no the
     *                                  same as the images, resampling will be performed.
     * @param {string} [options.resampleMethod='nearest'] The desired resampling method.
     * @param {boolean} [options.enableAlpha=false] Enable reading alpha channel if present.
     * @param {AbortSignal} [options.signal] An AbortSignal that may be signalled if the request is
     *                                       to be aborted
     * @returns {Promise<ReadRasterResult>} the RGB array as a Promise
     */
    readRGB({ window, interleave, pool, width, height, resampleMethod, enableAlpha, signal }?: {
        window?: number[] | undefined;
        interleave?: boolean | undefined;
        pool?: import("./pool.js").default | undefined;
        width?: number | undefined;
        height?: number | undefined;
        resampleMethod?: string | undefined;
        enableAlpha?: boolean | undefined;
        signal?: AbortSignal | undefined;
    } | undefined): Promise<ReadRasterResult>;
    /**
     * Returns an array of tiepoints.
     * @returns {Object[]}
     */
    getTiePoints(): any[];
    /**
     * Returns the parsed GDAL metadata items.
     *
     * If sample is passed to null, dataset-level metadata will be returned.
     * Otherwise only metadata specific to the provided sample will be returned.
     *
     * @param {number} [sample=null] The sample index.
     * @returns {Object}
     */
    getGDALMetadata(sample?: number | undefined): any;
    /**
     * Returns the GDAL nodata value
     * @returns {number|null}
     */
    getGDALNoData(): number | null;
    /**
     * Returns the image origin as a XYZ-vector. When the image has no affine
     * transformation, then an exception is thrown.
     * @returns {Array<number>} The origin as a vector
     */
    getOrigin(): Array<number>;
    /**
     * Returns the image resolution as a XYZ-vector. When the image has no affine
     * transformation, then an exception is thrown.
     * @param {GeoTIFFImage} [referenceImage=null] A reference image to calculate the resolution from
     *                                             in cases when the current image does not have the
     *                                             required tags on its own.
     * @returns {Array<number>} The resolution as a vector
     */
    getResolution(referenceImage?: GeoTIFFImage | undefined): Array<number>;
    /**
     * Returns whether or not the pixels of the image depict an area (or point).
     * @returns {Boolean} Whether the pixels are a point
     */
    pixelIsArea(): boolean;
    /**
     * Returns the image bounding box as an array of 4 values: min-x, min-y,
     * max-x and max-y. When the image has no affine transformation, then an
     * exception is thrown.
     * @returns {Array<number>} The bounding box
     */
    getBoundingBox(): Array<number>;
}
//# sourceMappingURL=geotiffimage.d.ts.map