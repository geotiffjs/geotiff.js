export default class DataView64 {
    constructor(arrayBuffer: any);
    _dataView: DataView;
    get buffer(): ArrayBuffer;
    getUint64(offset: any, littleEndian: any): number;
    getInt64(offset: any, littleEndian: any): number;
    getUint8(offset: any, littleEndian: any): number;
    getInt8(offset: any, littleEndian: any): number;
    getUint16(offset: any, littleEndian: any): number;
    getInt16(offset: any, littleEndian: any): number;
    getUint32(offset: any, littleEndian: any): number;
    getInt32(offset: any, littleEndian: any): number;
    getFloat16(offset: any, littleEndian: any): number;
    getFloat32(offset: any, littleEndian: any): number;
    getFloat64(offset: any, littleEndian: any): number;
}
//# sourceMappingURL=dataview64.d.ts.map