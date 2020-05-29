import { Params, ParamsDictionary, RequestHandler } from 'express-serve-static-core';

export interface ParsedQs {
  [key: string]: any;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Response {
      startStream(parameters: { heartbeatInterval: number }): void;
    }
  }
}

export type WolkenkitRequestHandler<TParamsDictionay extends Params = ParamsDictionary, TResBody = any, TReqBody = any, TReqQuery = ParsedQs> = RequestHandler<TParamsDictionay, TResBody, TReqBody, TReqQuery>;
