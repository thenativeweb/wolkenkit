"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const DomainEvent_1 = require("../../../../common/elements/DomainEvent");
const FilterHeartbeatsTransform_1 = require("../../../../common/utils/http/FilterHeartbeatsTransform");
const flaschenpost_1 = require("flaschenpost");
const HttpClient_1 = require("../../../shared/HttpClient");
const ParseJsonTransform_1 = require("../../../../common/utils/http/ParseJsonTransform");
const stream_to_string_1 = __importDefault(require("stream-to-string"));
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const stream_1 = require("stream");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
class Client extends HttpClient_1.HttpClient {
    constructor({ protocol = 'http', hostName, portOrSocket, path = '/' }) {
        super({ protocol, hostName, portOrSocket, path });
    }
    async getLastDomainEvent({ aggregateIdentifier }) {
        const { data, status } = await this.axios({
            method: 'get',
            url: `${this.url}/last-domain-event?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });
        if (status === 200) {
            return new DomainEvent_1.DomainEvent(data);
        }
        if (status === 404) {
            return;
        }
        switch (data.code) {
            case errors.AggregateIdentifierMalformed.code: {
                throw new errors.AggregateIdentifierMalformed(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status }));
                throw new errors.UnknownError(data.message);
            }
        }
    }
    async getDomainEventsByCausationId({ causationId }) {
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/domain-events-by-causation-id?causation-id=${causationId}`,
            responseType: 'stream'
        });
        if (status !== 200) {
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status }));
            throw new errors.UnknownError(data.message);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, passThrough, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { err }));
            }
        });
    }
    async hasDomainEventsWithCausationId({ causationId }) {
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/has-domain-events-with-causation-id?causation-id=${causationId}`
        });
        if (status !== 200) {
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status }));
            throw new errors.UnknownError(data.message);
        }
        return data.hasDomainEventsWithCausationId;
    }
    async getDomainEventsByCorrelationId({ correlationId }) {
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/domain-events-by-correlation-id?correlation-id=${correlationId}`,
            responseType: 'stream'
        });
        if (status !== 200) {
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status }));
            throw new errors.UnknownError(data.message);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, passThrough, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { err }));
            }
        });
    }
    async getReplay({ fromTimestamp = 0 }) {
        if (fromTimestamp < 0) {
            throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
        }
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/replay?fromTimestamp=${fromTimestamp}`,
            responseType: 'stream'
        });
        if (status !== 200) {
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: JSON.parse(await stream_to_string_1.default(data)), status }));
            throw new errors.UnknownError(data.message);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, passThrough, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { err }));
            }
        });
    }
    async getReplayForAggregate({ aggregateId, fromRevision = 1, toRevision = (2 ** 31) - 1 }) {
        if (fromRevision < 1) {
            throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
        }
        if (toRevision < 1) {
            throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
        }
        if (toRevision < fromRevision) {
            throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
        }
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/replay/${aggregateId}/?fromRevision=${fromRevision}&toRevision=${toRevision}`,
            responseType: 'stream'
        });
        if (status !== 200) {
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status }));
            throw new errors.UnknownError(data.message);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, passThrough, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { err }));
            }
        });
    }
    async getSnapshot({ aggregateIdentifier }) {
        const { data, status } = await this.axios({
            method: 'get',
            url: `${this.url}/snapshot?aggregateIdentifier=${JSON.stringify(aggregateIdentifier)}`
        });
        if (status === 200) {
            return data;
        }
        switch (data.code) {
            case errors.SnapshotNotFound.code: {
                return;
            }
            case errors.AggregateIdentifierMalformed.code: {
                throw new errors.AggregateIdentifierMalformed(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error: data, status }));
                throw new errors.UnknownError(data.message);
            }
        }
    }
    async getAggregateIdentifiers() {
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/get-aggregate-identifiers`,
            responseType: 'stream'
        });
        if (status !== 200) {
            const error = JSON.parse(await stream_to_string_1.default(data));
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error, status }));
            throw new errors.UnknownError();
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, passThrough, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { err }));
            }
        });
    }
    async getAggregateIdentifiersByName({ contextName, aggregateName }) {
        const { status, data } = await this.axios({
            method: 'get',
            url: `${this.url}/get-aggregate-identifiers-by-name?contextName=${contextName}&aggregateName=${aggregateName}`,
            responseType: 'stream'
        });
        if (status !== 200) {
            const error = JSON.parse(await stream_to_string_1.default(data));
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { error, status }));
            throw new errors.UnknownError(data.message);
        }
        const passThrough = new stream_1.PassThrough({ objectMode: true });
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, passThrough, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'queryDomainEventStore', { err }));
            }
        });
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map