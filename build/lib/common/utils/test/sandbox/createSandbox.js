"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSandbox = void 0;
const createSandboxForAggregate_1 = require("./createSandboxForAggregate");
const createSandboxForFlow_1 = require("./createSandboxForFlow");
const createSandboxForView_1 = require("./createSandboxForView");
const createSandbox = function () {
    return {
        withApplication({ application }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return initializedSandbox({
                application
            });
        }
    };
};
exports.createSandbox = createSandbox;
const initializedSandbox = function (sandboxConfiguration) {
    return {
        withDomainEventStore({ domainEventStore }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                domainEventStore
            });
        },
        withFlowProgressStore({ flowProgressStore }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                flowProgressStore
            });
        },
        withLockStore({ lockStore }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                lockStore
            });
        },
        withSnapshotStrategy({ snapshotStrategy }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                snapshotStrategy
            });
        },
        withPublisher({ publisher }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                publisher
            });
        },
        withAggregateServiceFactory({ aggregateServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                aggregateServiceFactory
            });
        },
        withAggregatesServiceFactory({ aggregatesServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                aggregatesServiceFactory
            });
        },
        withClientServiceFactory({ clientServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                clientServiceFactory
            });
        },
        withCommandServiceFactory({ commandServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                commandServiceFactory
            });
        },
        withLockServiceFactory({ lockServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                lockServiceFactory
            });
        },
        withLoggerServiceFactory({ loggerServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                loggerServiceFactory
            });
        },
        withNotificationServiceFactory({ notificationServiceFactory }) {
            return initializedSandbox({
                ...sandboxConfiguration,
                notificationServiceFactory
            });
        },
        forAggregate({ aggregateIdentifier }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return createSandboxForAggregate_1.createSandboxForAggregate({
                ...sandboxConfiguration,
                aggregateIdentifier,
                domainEvents: [],
                commands: []
            });
        },
        forFlow({ flowName }) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            return createSandboxForFlow_1.createSandboxForFlow({
                ...sandboxConfiguration,
                flowName,
                domainEvents: []
            });
        },
        forView({ viewName }) {
            return createSandboxForView_1.createSandboxForView({
                ...sandboxConfiguration,
                viewName
            });
        }
    };
};
//# sourceMappingURL=createSandbox.js.map