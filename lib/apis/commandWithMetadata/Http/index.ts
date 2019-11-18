import { ApplicationDefinition } from '../../../common/application/ApplicationDefinition';
import bodyParser from 'body-parser';
import { CommandData } from '../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../common/elements/CommandWithMetadata';
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

  public static async create ({
    corsOrigin,
    onReceiveCommand,
    applicationDefinition
  }: {
    corsOrigin: string | (string | RegExp)[];
    onReceiveCommand: ({ command }: { command: CommandWithMetadata<CommandData> }) => Promise<void>;
    applicationDefinition: ApplicationDefinition;
  }): Promise<Http> {
    let transformedCorsOrigin: string | (string | RegExp)[];

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

    const v2 = new V2({
      onReceiveCommand,
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

    return new Http({ v2, api });
  }
}

export { Http };
