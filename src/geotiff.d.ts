export declare class GeoTIFF {
  getImage(index?: number): Promise<GeoTIFF.GeoTIFFImage>;
  parseFileDirectoryAt(offset: number): Promise<GeoTIFF.ImageFileDirectory>;
  readRasters(options?: GeoTIFF.RasterOptions): Promise<TypedArray>;
  ifdRequests: { [key: number]: Promise<GeoTIFF.ImageFileDirectory> };
  dataView: DataView;
  littleEndian: boolean;
  cache: any;
  source: any;
}

export default GeoTIFF;

/** Typed array of data values, the basic building block of a geotiff */
export type TypedArray =
| Uint8Array
| Int8Array
| Uint16Array
| Int16Array
| Uint32Array
| Int32Array
| Float32Array
| Float64Array;

// A namespace with the same name as the default export is needed to declare additional type exports
// https://stackoverflow.com/a/51238234/4159809
export declare namespace GeoTIFF {

  export interface Pool {
    decode(
      fileDirectory: FileDirectory,
      buffer: ArrayBuffer
    ): Promise<ArrayBuffer>;
  }

  interface RasterOptions {
    window?: number[];
    bbox?: number[];
    samples?: number[];
    interleave?: boolean;
    pool?: Pool;
    width?: number;
    height?: number;
    resampleMethod?: string;
    enableAlpha?: boolean;
    signal?: AbortSignal;
  }

  type RasterData = (TypedArray | TypedArray[]) & {
    width: number;
    height: number;
  };

  interface FileDirectory {
    ImageDescription: string;
    SubIFDs?: number[];
    PhotometricInterpretation?: number;
  }

  interface ImageFileDirectory {
    fileDirectory: FileDirectory;
    geoKeyDirectory: any;
  }

  export class GeoTIFFImage {
    constructor(
    fileDirectory: FileDirectory,
    geoKeyDirectory: any,
    dataView: DataView,
    littleEndian: boolean,
    cache: any,
    source: any
    );
    fileDirectory: FileDirectory;
    getBoundingBox(): number[];
    getFileDirectory(): FileDirectory;
    getBytesPerPixel(): number;
    getHeight(): number;
    getSamplesPerPixel(): number;
    getTileHeight(): number;
    getTileWidth(): number;
    getWidth(): number;
    readRasters(options?: RasterOptions): Promise<RasterData>;
  }

  export function fromArrayBuffer(arrayBuffer: ArrayBuffer, signal?: AbortSignal): Promise<GeoTIFF>;
  export function writeArrayBuffer(values: number[], metadata: any): ArrayBufferLike;
  export function fromUrl(url: string, headers?: object): Promise<GeoTIFF>;
  export function fromBlob(blob: Blob): Promise<GeoTIFF>;
}
