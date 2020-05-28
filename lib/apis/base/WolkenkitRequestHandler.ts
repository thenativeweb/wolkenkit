import { ParamsDictionary, RequestHandler } from 'express-serve-static-core';

export type WolkenkitRequestHandler = RequestHandler<ParamsDictionary, any, any, { [key: string]: any }>;
