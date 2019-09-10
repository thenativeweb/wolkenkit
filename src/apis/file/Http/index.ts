import cors from 'cors';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { Filestore } from '../../../stores/filestore/Filestore';
import { IdentityProvider } from 'limes';
import { SpecificAuthorizationOption } from './V2/isAuthorized/AuthorizationOptions';
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

  public static async initialize ({
    corsOrigin,
    addFileAuthorizationOptions,
    identityProviders,
    filestore
  }: {
    corsOrigin: string | RegExp | string[];
    addFileAuthorizationOptions: SpecificAuthorizationOption;
    identityProviders: IdentityProvider[];
    filestore: Filestore;
  }): Promise<Http> {
    let transformedCorsOrigin;

    if (corsOrigin === '*') {
      transformedCorsOrigin = corsOrigin;
    } else {
      transformedCorsOrigin = [ corsOrigin ].flat();
    }

    const v2 = new V2({ addFileAuthorizationOptions, identityProviders, provider: filestore });

    const api = express();

    api.use(cors({
      origin: transformedCorsOrigin,
      allowedHeaders: [ 'content-type', 'authorization', 'x-metadata', 'x-to' ],
      exposedHeaders: [ 'content-length', 'content-type', 'content-disposition', 'x-metadata' ]
    }));

    api.use('/v2', v2.api);

    return new Http({ v2, api });
  }
}

export default Http;
