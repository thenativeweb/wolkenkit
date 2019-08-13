import Application from '../../../common/application';
import bodyParser from 'body-parser';
import cors from 'cors';
import EventInternal from '../../../common/elements/EventInternal';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { IdentityProvider } from '../../../../types/limes';
import nocache from 'nocache';
import { OnReceiveEvent } from './V2/postEvent';
import { Purpose } from '../../shared/Purpose';
import Repository from '../../../common/domain/Repository';
import V2 from './V2';

class Http {
  public v2: V2;

  public purpose: Purpose;

  public api: Express;

  protected constructor ({ v2, api, purpose }: {
    v2: V2;
    api: Express;
    purpose: Purpose;
  }) {
    this.v2 = v2;
    this.purpose = purpose;
    this.api = api;
  }

  public static async initialize ({
    corsOrigin,
    purpose,
    onReceiveEvent,
    application,
    repository,
    identityProviders,
    heartbeatInterval = 90 * 1000
  }: {
    corsOrigin: string | RegExp | string[];
    purpose: Purpose;
    onReceiveEvent: OnReceiveEvent;
    application: Application;
    repository: Repository;
    identityProviders: IdentityProvider[];
    heartbeatInterval?: number;
  }): Promise<Http> {
    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

    const v2 = new V2({
      purpose,
      onReceiveEvent,
      application,
      repository,
      identityProviders,
      heartbeatInterval
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

    return new Http({ v2, purpose, api });
  }

  public async sendEvent ({ event }: {
    event: EventInternal;
  }): Promise<void> {
    if (this.purpose !== 'external') {
      throw new Error('Invalid operation.');
    }

    await this.v2.sendEvent({ event });
  }
}

export default Http;
