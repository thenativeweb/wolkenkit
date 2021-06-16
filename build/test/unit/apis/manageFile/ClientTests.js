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
const assertthat_1 = require("assertthat");
const Client_1 = require("../../../../lib/apis/manageFile/http/v2/Client");
const http_1 = require("../../../../lib/apis/manageFile/http");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const InMemory_1 = require("../../../../lib/stores/fileStore/InMemory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const stream_1 = require("stream");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const stream_to_string_1 = __importDefault(require("stream-to-string"));
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('manageFile/http/Client', () => {
    const identityProviders = [identityProvider_1.identityProvider];
    let application, file;
    suite('/v2', () => {
        let api, fileStore;
        suiteSetup(async () => {
            const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withHooksForFiles' });
            application = await loadApplication_1.loadApplication({ applicationDirectory });
        });
        setup(async () => {
            fileStore = await InMemory_1.InMemoryFileStore.create({ type: 'InMemory' });
            ({ api } = await http_1.getApi({
                application,
                corsOrigin: '*',
                identityProviders,
                fileStore
            }));
            file = {
                id: uuid_1.v4(),
                name: uuid_1.v4(),
                content: 'Hello world!'
            };
        });
        suite('addFile', () => {
            test('throws a not authenticated exception if the adding file hook throws a not authenticated exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.addFile({
                        id: file.id,
                        name: 'addingFile-unauthenticated',
                        contentType: 'text/plain',
                        stream: stream_1.Readable.from(file.content)
                    });
                }).is.throwingAsync((ex) => ex.code === errors.NotAuthenticated.code);
            });
            test('throws an unknown error if the adding file hook throws another exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.addFile({
                        id: file.id,
                        name: 'addingFile-failure',
                        contentType: 'text/plain',
                        stream: stream_1.Readable.from(file.content)
                    });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code);
            });
            test('throws an unknown error if the added file hook throws an exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.addFile({
                        id: file.id,
                        name: 'addedFile-failure',
                        contentType: 'text/plain',
                        stream: stream_1.Readable.from(file.content)
                    });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code);
            });
            test('adds the given file.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: file.name,
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                assertthat_1.assert.that(await fileStore.getMetadata({ id: file.id })).is.equalTo({
                    id: file.id,
                    name: file.name,
                    contentType: 'text/plain',
                    contentLength: file.content.length
                });
            });
            test('throws a file already exists error when the file to upload already exists.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: file.name,
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await assertthat_1.assert.that(async () => {
                    await client.addFile({
                        id: file.id,
                        name: file.name,
                        contentType: 'text/plain',
                        stream: stream_1.Readable.from(file.content)
                    });
                }).is.throwingAsync((ex) => ex.code === errors.FileAlreadyExists.code);
            });
        });
        suite('getFile', () => {
            test('throws a not authenticated exception if the getting file hook throws a not authenticated exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: 'gettingFile-unauthenticated',
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await assertthat_1.assert.that(async () => {
                    await client.getFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.NotAuthenticated.code);
            });
            test('throws an unknown error if the getting file hook throws any other exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: 'gettingFile-failure',
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await assertthat_1.assert.that(async () => {
                    await client.getFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code);
            });
            test('returns the file even if the got file hook throws an exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: 'gotFile-failure',
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                const { stream } = await client.getFile({ id: file.id });
                const content = await stream_to_string_1.default(stream);
                assertthat_1.assert.that(content).is.equalTo(file.content);
            });
            test('throws a file not found exception if the requested file does not exist.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.getFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.FileNotFound.code);
            });
            test('returns the requested file and its metadata.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: file.name,
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                const { id, name, contentType, stream } = await client.getFile({ id: file.id });
                const content = await stream_to_string_1.default(stream);
                assertthat_1.assert.that(id).is.equalTo(file.id);
                assertthat_1.assert.that(name).is.equalTo(file.name);
                assertthat_1.assert.that(contentType).is.startingWith('text/plain');
                assertthat_1.assert.that(content).is.equalTo(file.content);
            });
        });
        suite('removeFile', () => {
            test('throws a not authenticated if the removing file hook throws a not authenticated exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: 'removingFile-unauthenticated',
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await assertthat_1.assert.that(async () => {
                    await client.removeFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.NotAuthenticated.code);
            });
            test('throws an unknown error if the removing file hook throws another exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: 'removingFile-failure',
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await assertthat_1.assert.that(async () => {
                    await client.removeFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code);
            });
            test('throws an unknown error if the removed file hook throws an exception.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: 'removedFile-failure',
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await assertthat_1.assert.that(async () => {
                    await client.removeFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.UnknownError.code);
            });
            test('removes the given file.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await client.addFile({
                    id: file.id,
                    name: file.name,
                    contentType: 'text/plain',
                    stream: stream_1.Readable.from(file.content)
                });
                await client.removeFile({ id: file.id });
                await assertthat_1.assert.that(async () => {
                    await fileStore.getMetadata({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.FileNotFound.code);
            });
            test('returns a file not found exception if the given file does not exist.', async () => {
                const { socket } = await runAsServer_1.runAsServer({ app: api });
                const client = new Client_1.Client({
                    hostName: 'localhost',
                    portOrSocket: socket,
                    path: '/v2'
                });
                await assertthat_1.assert.that(async () => {
                    await client.removeFile({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.FileNotFound.code);
            });
        });
    });
});
//# sourceMappingURL=ClientTests.js.map