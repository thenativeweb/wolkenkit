import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { Express } from 'express-serve-static-core';
import fs from 'fs';
import nocache from 'nocache';
import { promisify } from 'util';

const stat = promisify(fs.stat);

class Http {
  public api: Express;

  protected constructor ({ api }: {
    api: Express;
  }) {
    this.api = api;
  }

  public static async create ({ corsOrigin, serveStatic }: {
    corsOrigin: string | RegExp | string[];
    serveStatic: string;
  }): Promise<Http> {
    if (!corsOrigin) {
      throw new Error('CORS origin is missing.');
    }
    if (!serveStatic) {
      throw new Error('Serve static is missing.');
    }

    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

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

    let staticPath;

    try {
      /* eslint-disable no-sync */
      staticPath = await stat(serveStatic);
      /* eslint-enble no-sync */
    } catch {
      throw new Error('Serve static is an invalid path.');
    }

    if (!staticPath.isDirectory()) {
      throw new Error('Serve static is not a directory.');
    }

    api.use(compression());
    api.use('/', express.static(serveStatic));

    return new Http({ api });
  }
}

export default Http;
