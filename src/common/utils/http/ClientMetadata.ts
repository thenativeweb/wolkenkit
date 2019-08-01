class ClientMetadata {
  public token: string;

  public user: { id: string; claims: { [key: string]: any } };

  public ip: string;

  public constructor ({ req }: {
    req: {
      token: string;
      user: { id: string; claims: { [key: string]: any } };
      connection: { remoteAddress: string };
      headers: { [key: string]: string };
    };
  }) {
    this.token = req.token;
    this.user = { id: req.user.id, claims: req.user.claims };
    this.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
}

export default ClientMetadata;
