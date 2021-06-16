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
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const http_1 = require("../../../../lib/apis/manageFile/http");
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const identityProvider_1 = require("../../../shared/identityProvider");
const InMemory_1 = require("../../../../lib/stores/fileStore/InMemory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const stream_1 = require("stream");
const runAsServer_1 = require("../../../shared/http/runAsServer");
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('manageFile/http', () => {
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
        suite('POST /add-file', () => {
            test('returns 400 if invalid headers are sent.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': uuid_1.v4(),
                        'x-name': uuid_1.v4(),
                        'content-type': 'invalid-content-type'
                    },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(400);
            });
            test('returns 401 if the adding file hook throws a not authenticated exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': uuid_1.v4(),
                        'x-name': 'addingFile-unauthenticated',
                        'content-type': 'text/plain'
                    },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(401);
            });
            test('returns 500 if the adding file hook throws another exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': uuid_1.v4(),
                        'x-name': 'addingFile-failure',
                        'content-type': 'text/plain'
                    },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(500);
            });
            test('returns 500 if the added file hook throws an exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': uuid_1.v4(),
                        'x-name': 'addedFile-failure',
                        'content-type': 'text/plain'
                    },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(500);
            });
            test('adds the given file.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': file.name,
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content),
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(await fileStore.getMetadata({ id: file.id })).is.equalTo({
                    id: file.id,
                    name: file.name,
                    contentType: 'text/plain',
                    contentLength: file.content.length
                });
            });
            test('returns 409 when the file to upload already exists.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': file.name,
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': file.name,
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content),
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(409);
            });
        });
        suite('GET /file/:id', () => {
            test('returns 401 if the getting file hook throws a not authenticated exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': 'gettingFile-unauthenticated',
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'get',
                    url: `/v2/file/${file.id}`,
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(401);
            });
            test('returns 500 if the getting file hook throws any other exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': 'gettingFile-failure',
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'get',
                    url: `/v2/file/${file.id}`,
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(500);
            });
            test('returns 200 even if the got file hook throws an exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': 'gotFile-failure',
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'get',
                    url: `/v2/file/${file.id}`,
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
            });
            test('returns 404 if the requested file does not exist.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'get',
                    url: `/v2/file/${file.id}`,
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
            test('returns the requested file.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': file.name,
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status, headers, data } = await client({
                    method: 'get',
                    url: `/v2/file/${file.id}`,
                    responseType: 'text',
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                assertthat_1.assert.that(headers['x-id']).is.startingWith(file.id);
                assertthat_1.assert.that(headers['x-name']).is.startingWith(file.name);
                assertthat_1.assert.that(headers['content-type']).is.startingWith('text/plain');
                assertthat_1.assert.that(headers['content-length']).is.equalTo(`${file.content.length}`);
                assertthat_1.assert.that(data).is.equalTo(file.content);
            });
        });
        suite('POST /remove-file', () => {
            test('returns 415 if the content-type header is not set to application/json.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/remove-file',
                    headers: {
                        'content-type': 'invalid-content-type'
                    },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(415);
            });
            test('returns 401 if the removing file hook throws a not authenticated exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': 'removingFile-unauthenticated',
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/remove-file',
                    data: { id: file.id },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(401);
            });
            test('returns 500 if the removing file hook throws another exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': 'removingFile-failure',
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/remove-file',
                    data: { id: file.id },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(500);
            });
            test('returns 500 if the removed file hook throws an exception.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': 'removedFile-failure',
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/remove-file',
                    data: { id: file.id },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(500);
            });
            test('returns 200 and removes the given file.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                await client({
                    method: 'post',
                    url: '/v2/add-file',
                    headers: {
                        'x-id': file.id,
                        'x-name': file.name,
                        'content-type': 'text/plain'
                    },
                    data: stream_1.Readable.from(file.content)
                });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/remove-file',
                    data: { id: file.id },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(200);
                await assertthat_1.assert.that(async () => {
                    await fileStore.getMetadata({ id: file.id });
                }).is.throwingAsync((ex) => ex.code === errors.FileNotFound.code);
            });
            test('returns 404 if the given file does not exist.', async () => {
                const { client } = await runAsServer_1.runAsServer({ app: api });
                const { status } = await client({
                    method: 'post',
                    url: '/v2/remove-file',
                    data: { id: file.id },
                    validateStatus() {
                        return true;
                    }
                });
                assertthat_1.assert.that(status).is.equalTo(404);
            });
        });
    });
});
//# sourceMappingURL=httpTests.js.map