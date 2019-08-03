import { IDictionary } from '../../../types/IDictionary';

class ClientMetadata {
  public token: string;

  public user: { id: string; claims: IDictionary<any> };

  public ip: string;

  public constructor ({ req }: {
    req: {
      token: string;
      user: { id: string; claims: IDictionary<any> };
      connection: { remoteAddress: string };
      headers: IDictionary<string>;
    };
  }) {
    this.token = req.token;
    this.user = { id: req.user.id, claims: req.user.claims };
    this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
}

export default ClientMetadata;
