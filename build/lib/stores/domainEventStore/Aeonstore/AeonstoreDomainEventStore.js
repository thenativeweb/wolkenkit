"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AeonstoreDomainEventStore = void 0;
const Client_1 = require("../../../apis/queryDomainEventStore/http/v2/Client");
const Client_2 = require("../../../apis/writeDomainEventStore/http/v2/Client");
class AeonstoreDomainEventStore {
    constructor({ protocol = 'http', hostName, portOrSocket, path = '/' }) {
        const trimmedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        this.queryClient = new Client_1.Client({
            protocol, hostName, portOrSocket, path: `${trimmedPath}/query/v2`
        });
        this.writeClient = new Client_2.Client({
            protocol, hostName, portOrSocket, path: `${trimmedPath}/write/v2`
        });
    }
    static async create({ protocol = 'http', hostName, portOrSocket, path = '/' }) {
        return new AeonstoreDomainEventStore({ protocol, hostName, portOrSocket, path });
    }
    async getLastDomainEvent({ aggregateIdentifier }) {
        return await this.queryClient.getLastDomainEvent({ aggregateIdentifier });
    }
    async getDomainEventsByCausationId({ causationId }) {
        return await this.queryClient.getDomainEventsByCausationId({ causationId });
    }
    async hasDomainEventsWithCausationId({ causationId }) {
        return await this.queryClient.hasDomainEventsWithCausationId({ causationId });
    }
    async getDomainEventsByCorrelationId({ correlationId }) {
        return await this.queryClient.getDomainEventsByCorrelationId({ correlationId });
    }
    async getReplay({ fromTimestamp = 0 }) {
        return await this.queryClient.getReplay({ fromTimestamp });
    }
    async getReplayForAggregate({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1 }) {
        return await this.queryClient.getReplayForAggregate({
            aggregateId,
            fromRevision,
            toRevision
        });
    }
    async getSnapshot({ aggregateIdentifier }) {
        return await this.queryClient.getSnapshot({ aggregateIdentifier });
    }
    async storeDomainEvents({ domainEvents }) {
        await this.writeClient.storeDomainEvents({ domainEvents });
    }
    async storeSnapshot({ snapshot }) {
        await this.writeClient.storeSnapshot({ snapshot });
    }
    async getAggregateIdentifiers() {
        return await this.queryClient.getAggregateIdentifiers();
    }
    async getAggregateIdentifiersByName({ contextName, aggregateName }) {
        return await this.queryClient.getAggregateIdentifiersByName({
            contextName,
            aggregateName
        });
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        // There is nothing to do here.
    }
    // eslint-disable-next-line class-methods-use-this
    async destroy() {
        // There is nothing to do here.
    }
}
exports.AeonstoreDomainEventStore = AeonstoreDomainEventStore;
//# sourceMappingURL=AeonstoreDomainEventStore.js.map