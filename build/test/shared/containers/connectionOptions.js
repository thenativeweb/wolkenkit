"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionOptions = void 0;
const connectionOptions = {
    mariaDb: {
        hostName: 'localhost',
        port: 3307,
        userName: 'wolkenkit',
        password: 'wolkenkit',
        database: 'wolkenkit'
    },
    minio: {
        hostName: 'localhost',
        port: 9000,
        accessKey: 'wolkenkit',
        secretKey: 'wolkenkit',
        encryptConnection: false
    },
    mongoDb: {
        connectionString: 'mongodb://wolkenkit:wolkenkit@localhost:27017/wolkenkit'
    },
    mySql: {
        hostName: 'localhost',
        port: 3308,
        userName: 'wolkenkit',
        password: 'wolkenkit',
        database: 'wolkenkit'
    },
    postgres: {
        hostName: 'localhost',
        port: 5432,
        userName: 'wolkenkit',
        password: 'wolkenkit',
        database: 'wolkenkit'
    },
    redis: {
        hostName: 'localhost',
        port: 6379,
        password: 'wolkenkit',
        database: 0
    },
    sqlServer: {
        hostName: 'localhost',
        port: 1433,
        userName: 'SA',
        password: 'Wolkenkit123',
        database: 'wolkenkit'
    }
};
exports.connectionOptions = connectionOptions;
//# sourceMappingURL=connectionOptions.js.map