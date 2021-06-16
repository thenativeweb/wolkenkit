"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getAggregateIdentifiers_1 = require("./getAggregateIdentifiers");
const getAggregateIdentifiersByName_1 = require("./getAggregateIdentifiersByName");
const getApiBase_1 = require("../../../base/getApiBase");
const getDomainEventsByCausationId_1 = require("./getDomainEventsByCausationId");
const getDomainEventsByCorrelationId_1 = require("./getDomainEventsByCorrelationId");
const getLastDomainEvent_1 = require("./getLastDomainEvent");
const flaschenpost_1 = require("flaschenpost");
const getReplay_1 = require("./getReplay");
const getReplayForAggregate_1 = require("./getReplayForAggregate");
const getSnapshot_1 = require("./getSnapshot");
const hasDomainEventsWithCausationId_1 = require("./hasDomainEventsWithCausationId");
const getV2 = async function ({ domainEventStore, corsOrigin, heartbeatInterval = 90000 }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: { cors: { origin: corsOrigin } },
            body: { parser: false },
            query: { parser: { useJson: true } }
        },
        response: {
            headers: { cache: false }
        }
    });
    const loggingOnResponseMiddleware = flaschenpost_1.getMiddleware();
    const loggingOnRequestMiddleware = flaschenpost_1.getMiddleware({ logOn: 'request' });
    api.get(`/${getReplay_1.getReplay.path}`, loggingOnRequestMiddleware, getReplay_1.getReplay.getHandler({
        domainEventStore,
        heartbeatInterval
    }));
    api.get(`/${getReplayForAggregate_1.getReplayForAggregate.path}`, loggingOnRequestMiddleware, getReplayForAggregate_1.getReplayForAggregate.getHandler({
        domainEventStore,
        heartbeatInterval
    }));
    api.get(`/${getLastDomainEvent_1.getLastDomainEvent.path}`, loggingOnResponseMiddleware, getLastDomainEvent_1.getLastDomainEvent.getHandler({
        domainEventStore
    }));
    api.get(`/${getDomainEventsByCausationId_1.getDomainEventsByCausationId.path}`, loggingOnRequestMiddleware, getDomainEventsByCausationId_1.getDomainEventsByCausationId.getHandler({
        domainEventStore,
        heartbeatInterval
    }));
    api.get(`/${hasDomainEventsWithCausationId_1.hasDomainEventsWithCausationId.path}`, loggingOnResponseMiddleware, hasDomainEventsWithCausationId_1.hasDomainEventsWithCausationId.getHandler({
        domainEventStore
    }));
    api.get(`/${getDomainEventsByCorrelationId_1.getDomainEventsByCorrelationId.path}`, loggingOnRequestMiddleware, getDomainEventsByCorrelationId_1.getDomainEventsByCorrelationId.getHandler({
        domainEventStore,
        heartbeatInterval
    }));
    api.get(`/${getSnapshot_1.getSnapshot.path}`, loggingOnResponseMiddleware, getSnapshot_1.getSnapshot.getHandler({
        domainEventStore
    }));
    api.get(`/${getAggregateIdentifiers_1.getAggregateIdentifiers.path}`, loggingOnRequestMiddleware, getAggregateIdentifiers_1.getAggregateIdentifiers.getHandler({
        domainEventStore,
        heartbeatInterval
    }));
    api.get(`/${getAggregateIdentifiersByName_1.getAggregateIdentifiersByName.path}`, loggingOnRequestMiddleware, getAggregateIdentifiersByName_1.getAggregateIdentifiersByName.getHandler({
        domainEventStore,
        heartbeatInterval
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map