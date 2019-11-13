import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import bodyParser from 'body-parser';
import cors from 'cors';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../common/elements/DomainEventWithState';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { IdentityProvider } from 'limes';
import nocache from 'nocache';
import { Repository } from '../../../common/domain/Repository';
import { State } from '../../../common/elements/State';
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

  public static async create ({
    corsOrigin,
    applicationDefinition,
    repository,
    identityProviders,
    heartbeatInterval = 90 * 1000
  }: {
    corsOrigin: string | RegExp | (string | RegExp)[];
    applicationDefinition: ApplicationDefinition;
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
      applicationDefinition,
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

    return new Http({ v2, api });
  }

  public async publishDomainEvent ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): Promise<void> {
    await this.v2.publishDomainEvent({ domainEvent });
  }
}

export { Http };
