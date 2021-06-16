import { Params, ParamsDictionary, RequestHandler } from 'express-serve-static-core';
export interface ParsedQs {
    [key: string]: any;
}
declare global {
    namespace Express {
        interface Response {
            startStream: (parameters: {
                heartbeatInterval: number | false;
            }) => void;
        }
    }
}
export declare type WolkenkitRequestHandler<TParamsDictionay extends Params = ParamsDictionary, TResBody = any, TReqBody = any, TReqQuery = ParsedQs> = RequestHandler<TParamsDictionay, TResBody, TReqBody, TReqQuery>;
