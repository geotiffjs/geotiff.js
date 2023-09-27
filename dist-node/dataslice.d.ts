export default class DataSlice {
    constructor(arrayBuffer: any, sliceOffset: any, littleEndian: any, bigTiff: any);
    _dataView: DataView;
    _sliceOffset: any;
    _littleEndian: any;
    _bigTiff: any;
    get sliceOffset(): any;
    get sliceTop(): any;
    get littleEndian(): any;
    get bigTiff(): any;
    get buffer(): ArrayBuffer;
    covers(offset: any, length: any): boolean;
    readUint8(offset: any): number;
    readInt8(offset: any): number;
    readUint16(offset: any): number;
    readInt16(offset: any): number;
    readUint32(offset: any): number;
    readInt32(offset: any): number;
    readFloat32(offset: any): number;
    readFloat64(offset: any): number;
    readUint64(offset: any): number;
    readInt64(offset: any): number;
    readOffset(offset: any): number;
}
//# sourceMappingURL=dataslice.d.ts.map