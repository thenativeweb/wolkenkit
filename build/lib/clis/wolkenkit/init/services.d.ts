declare const services: {
    microservice: {
        command: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        commandDispatcher: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        domain: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        domainEvent: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        aeonstore: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        publisher: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        graphql: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        domainEventDispatcher: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        flow: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        replay: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        view: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        notification: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        file: {
            hostName: string;
            privatePort: number;
            healthPort: number;
        };
        traefik: {
            hostName: string;
            publicPort: number;
        };
    };
    singleProcess: {
        main: {
            hostName: string;
            publicPort: number;
            privatePort: number;
            healthPort: number;
        };
    };
    stores: {
        postgres: {
            hostName: string;
            privatePort: number;
            userName: string;
            password: string;
            database: string;
        };
        minio: {
            hostName: string;
            privatePort: number;
            accessKey: string;
            secretKey: string;
            encryptConnection: boolean;
            bucketName: string;
        };
    };
};
export { services };
