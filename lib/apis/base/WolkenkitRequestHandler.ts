import { Params, ParamsDictionary, RequestHandler } from 'express-serve-static-core';

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ParsedQs {
  [key: string]: any;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,@typescript-eslint/no-unused-vars
  namespace Express {
    export interface Response {
      startStream: (parameters: { heartbeatInterval: number | false }) => void;
    }
  }
}

export type WolkenkitRequestHandler<TParamsDictionay extends Params = ParamsDictionary, TResBody = any, TReqBody = any, TReqQuery = ParsedQs> = RequestHandler<TParamsDictionay, TResBody, TReqBody, TReqQuery>;
