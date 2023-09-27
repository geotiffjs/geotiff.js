/// <reference types="node" />
export class HttpClient extends BaseClient {
    parsedUrl: urlMod.UrlWithStringQuery;
    httpApi: typeof http | typeof https;
    constructRequest(headers: any, signal: any): Promise<any>;
}
import { BaseClient } from "./base.js";
import urlMod from "url";
import http from "http";
import https from "https";
//# sourceMappingURL=http.d.ts.map