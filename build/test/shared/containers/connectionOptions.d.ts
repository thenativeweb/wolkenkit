declare const connectionOptions: {
    mariaDb: {
        hostName: string;
        port: number;
        userName: string;
        password: string;
        database: string;
    };
    minio: {
        hostName: string;
        port: number;
        accessKey: string;
        secretKey: string;
        encryptConnection: boolean;
    };
    mongoDb: {
        connectionString: string;
    };
    mySql: {
        hostName: string;
        port: number;
        userName: string;
        password: string;
        database: string;
    };
    postgres: {
        hostName: string;
        port: number;
        userName: string;
        password: string;
        database: string;
    };
    redis: {
        hostName: string;
        port: number;
        password: string;
        database: number;
    };
    sqlServer: {
        hostName: string;
        port: number;
        userName: string;
        password: string;
        database: string;
    };
};
export { connectionOptions };
