"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.services = void 0;
const services = {
    microservice: {
        command: {
            hostName: 'command',
            privatePort: 3000,
            healthPort: 3001
        },
        commandDispatcher: {
            hostName: 'command-dispatcher',
            privatePort: 3000,
            healthPort: 3001
        },
        domain: {
            hostName: 'domain',
            privatePort: 3000,
            healthPort: 3001
        },
        domainEvent: {
            hostName: 'domain-event',
            privatePort: 3000,
            healthPort: 3001
        },
        aeonstore: {
            hostName: 'aeonstore',
            privatePort: 3000,
            healthPort: 3001
        },
        publisher: {
            hostName: 'publisher',
            privatePort: 3000,
            healthPort: 3001
        },
        graphql: {
            hostName: 'graphql',
            privatePort: 3000,
            healthPort: 3001
        },
        domainEventDispatcher: {
            hostName: 'domain-event-dispatcher',
            privatePort: 3000,
            healthPort: 3001
        },
        flow: {
            hostName: 'flow',
            privatePort: 3000,
            healthPort: 3001
        },
        replay: {
            hostName: 'replay',
            privatePort: 3000,
            healthPort: 3001
        },
        view: {
            hostName: 'view',
            privatePort: 3000,
            healthPort: 3001
        },
        notification: {
            hostName: 'notification',
            privatePort: 3000,
            healthPort: 3001
        },
        file: {
            hostName: 'file',
            privatePort: 3000,
            healthPort: 3001
        },
        traefik: {
            hostName: 'traefik',
            publicPort: 3000
        }
    },
    singleProcess: {
        main: {
            hostName: 'main',
            publicPort: 3000,
            privatePort: 3000,
            healthPort: 3001
        }
    },
    stores: {
        postgres: {
            hostName: 'postgres',
            privatePort: 5432,
            userName: 'wolkenkit',
            password: 'please-replace-this',
            database: 'wolkenkit'
        },
        minio: {
            hostName: 'minio',
            privatePort: 9000,
            accessKey: 'wolkenkit',
            secretKey: 'please-replace-this',
            encryptConnection: false,
            bucketName: 'files'
        }
    }
};
exports.services = services;
//# sourceMappingURL=services.js.map