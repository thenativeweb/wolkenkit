import Application from '../../../common/application/Application';
import bodyParser from 'body-parser';
import CommandInternal from '../../../common/elements/CommandInternal';
import cors from 'cors';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { IdentityProvider } from 'limes';
import nocache from 'nocache';
import { Purpose } from '../../shared/Purpose';
import V2 from './V2';

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

  public static async create ({
    corsOrigin,
    purpose,
    onReceiveCommand,
    application,
    identityProviders
  }: {
    corsOrigin: string | (string | RegExp)[];
    purpose: Purpose;
    onReceiveCommand: ({ command }: {command: CommandInternal}) => Promise<void>;
    application: Application;
    identityProviders: IdentityProvider[];
  }): Promise<Http> {
    let transformedCorsOrigin: string | (string | RegExp)[];

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

    const v2 = new V2({
      purpose,
      onReceiveCommand,
      application,
      identityProviders
    });

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
    api.use(bodyParser.json({ limit: '100kb' }));

    api.use('/v2', v2.api);

    return new Http({ v2, api });
  }
}

export default Http;
