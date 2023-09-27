export function makeFetchSource(url: any, { headers, credentials, maxRanges, allowFullFile, ...blockOptions }?: {
    headers?: {} | undefined;
    credentials: any;
    maxRanges?: number | undefined;
    allowFullFile?: boolean | undefined;
}): any;
export function makeXHRSource(url: any, { headers, maxRanges, allowFullFile, ...blockOptions }?: {
    headers?: {} | undefined;
    maxRanges?: number | undefined;
    allowFullFile?: boolean | undefined;
}): any;
export function makeHttpSource(url: any, { headers, maxRanges, allowFullFile, ...blockOptions }?: {
    headers?: {} | undefined;
    maxRanges?: number | undefined;
    allowFullFile?: boolean | undefined;
}): any;
/**
 *
 * @param {string} url
 * @param {object} options
 */
export function makeRemoteSource(url: string, { forceXHR, ...clientOptions }?: object): any;
//# sourceMappingURL=remote.d.ts.map