import express from 'express';
import { Express } from 'express-serve-static-core';
import { Filestore } from '../../../../stores/filestore/Filestore';
import getFile from './getFile';
import postAddFile from './postAddFile';
import postAuthorize from './postAuthorize';
import postRemoveFile from './postRemoveFile';
import postTransferOwnership from './postTransferOwnership';
import { SpecificAuthorizationOption } from './isAuthorized/AuthorizationOptions';
import Limes, { IdentityProvider } from 'limes';

class V2 {
  public api: Express;

  public constructor ({ addFileAuthorizationOptions, identityProviders, provider }: {
    addFileAuthorizationOptions: SpecificAuthorizationOption;
    identityProviders: IdentityProvider[];
    provider: Filestore;
  }) {
    this.api = express();

    const limes = new Limes({ identityProviders });
    const verifyTokenMiddleware = limes.verifyTokenMiddleware({
      // According to RFC 2606, .invalid is a reserved TLD you can use in cases
      // where you want to show that a domain is invalid. Since the tokens issued
      // for anonymous users are made-up, https://token.invalid makes up a valid
      // url, but we are sure that we do not run into any conflicts with the
      // domain.
      issuerForAnonymousTokens: 'https://token.invalid'
    });

    this.api.get('/file/:id', verifyTokenMiddleware, getFile({ provider }));

    this.api.post('/add-file', verifyTokenMiddleware, postAddFile({ addFileAuthorizationOptions, fileProvider: provider }));
    this.api.post('/remove-file', verifyTokenMiddleware, postRemoveFile({ fileProvider: provider }));
    this.api.post('/transfer-ownership', verifyTokenMiddleware, postTransferOwnership({ fileProvider: provider }));
    this.api.post('/authorize', verifyTokenMiddleware, postAuthorize({ fileProvider: provider }));
  }
}

export default V2;
