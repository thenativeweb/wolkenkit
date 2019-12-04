import { Claims } from 'limes';
import { errors } from '../../errors';
import { isArray } from 'lodash';
import { Request } from 'express-serve-static-core';

class ClientMetadata {
  public token: string;

  public user: { id: string; claims: Claims };

  public ip: string;

  public constructor ({ req }: {
    req: Request;
  }) {
    if (!req.token || !req.user) {
      throw new errors.NotAuthenticatedError('Client information missing in request.');
    }
    this.token = req.token;
    this.user = { id: req.user.id, claims: req.user.claims };

    const headers = req.headers['x-forwarded-for'];

    let header;

    if (isArray(headers)) {
      header = headers[0];
    } else {
      header = headers;
    }

    this.ip = header ?? req.connection.remoteAddress ?? '';
  }
}

export { ClientMetadata };
