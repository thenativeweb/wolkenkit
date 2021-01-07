import { Claims } from 'limes';
import { errors } from '../../errors';
import { isArray } from 'lodash';
import { Request } from 'express';

class ClientMetadata {
  public token: string;

  public user: { id: string; claims: Claims };

  public ip: string;

  public constructor ({ req }: {
    req: Request;
  }) {
    if (!req.token || !req.user) {
      throw new errors.NotAuthenticated('Client information missing in request.');
    }
    this.token = req.token;
    this.user = { id: req.user.id, claims: req.user.claims };

    const headers = req.headers['x-forwarded-for'];

    const header = isArray(headers) ? headers[0] : headers;

    this.ip = header ?? req.connection.remoteAddress ?? '0.0.0.0';
  }
}

export { ClientMetadata };
