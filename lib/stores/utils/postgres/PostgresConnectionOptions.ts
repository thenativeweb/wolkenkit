interface PostgresConnectionOptions {
  ca?: string;
  privateKey?: string;
  certificate?: string;
  rejectUnauthorized?: boolean;
}

export type {
  PostgresConnectionOptions
};
