import cors from 'cors';
import express from 'express';
import { Express } from 'express-serve-static-core';
import nocache from 'nocache';
import { V2 } from './V2';

class Http {
  public v2: V2;

  public api: Express;

  protected constructor ({ v2, api }: {
    v2: V2;
    api: Express;
  }) {
    this.v2 = v2;
    this.api = api;
  }

  public static async create ({ corsOrigin }: {
    corsOrigin: string | (RegExp | string)[];
  }): Promise<Http> {
    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

    const v2 = new V2();

    const api = express();

    api.options('*', cors({
      methods: [ 'GET', 'POST' ],
      origin: transformedCorsOrigin,
      optionsSuccessStatus: 200
    }));
    api.use(cors({
      methods: [ 'GET', 'POST' ],
      origin: transformedCorsOrigin,
      optionsSuccessStatus: 200
    }));

    api.use(nocache());
    api.use('/v2', v2.api);

    return new Http({ v2, api });
  }
}

export { Http };
