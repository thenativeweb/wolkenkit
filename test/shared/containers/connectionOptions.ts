const connectionOptions = {
  mariaDb: {
    hostName: 'localhost',
    port: 3_307,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit'
  },
  minio: {
    hostName: 'localhost',
    port: 9_000,
    accessKey: 'wolkenkit',
    secretKey: 'wolkenkit',
    encryptConnection: false
  },
  mongoDb: {
    connectionString: 'mongodb://wolkenkit:wolkenkit@localhost:27017/wolkenkit'
  },
  mySql: {
    hostName: 'localhost',
    port: 3_308,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit'
  },
  postgres: {
    hostName: 'localhost',
    port: 5_432,
    userName: 'wolkenkit',
    password: 'wolkenkit',
    database: 'wolkenkit'
  },
  redis: {
    hostName: 'localhost',
    port: 6_379,
    password: 'wolkenkit',
    database: 0
  },
  sqlServer: {
    hostName: 'localhost',
    port: 1_433,
    userName: 'SA',
    password: 'Wolkenkit123',
    database: 'wolkenkit'
  }
};

export { connectionOptions };
