import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { Express } from 'express-serve-static-core';
import nocache from 'nocache';
import { OnReceiveDomainEvent } from '../OnReceiveDomainEvent';
import { V2 } from './V2';

class Http {
  public v2: V2;

  public api: Express;

  public onReceiveDomainEvent: OnReceiveDomainEvent;

  protected constructor ({ v2, api, onReceiveDomainEvent }: {
    v2: V2;
    api: Express;
    onReceiveDomainEvent: OnReceiveDomainEvent;
  }) {
    this.v2 = v2;
    this.api = api;
    this.onReceiveDomainEvent = onReceiveDomainEvent;
  }

  public static async create ({
    onReceiveDomainEvent,
    corsOrigin,
    applicationDefinition
  }: {
    onReceiveDomainEvent: OnReceiveDomainEvent;
    corsOrigin: string | RegExp | (string | RegExp)[];
    applicationDefinition: ApplicationDefinition;
  }): Promise<Http> {
    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

    const v2 = new V2({
      onReceiveDomainEvent,
      applicationDefinition
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

    return new Http({ v2, api, onReceiveDomainEvent });
  }
}

export { Http };
