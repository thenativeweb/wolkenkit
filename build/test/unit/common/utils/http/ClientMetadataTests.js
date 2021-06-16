"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const ClientMetadata_1 = require("../../../../../lib/common/utils/http/ClientMetadata");
const uuid_1 = require("uuid");
suite('ClientMetadata', () => {
    suite('token', () => {
        test('contains the token.', async () => {
            const req = {
                token: '...',
                user: { id: uuid_1.v4(), claims: {} },
                connection: { remoteAddress: '127.0.0.1' },
                headers: {}
            };
            const clientMetadata = new ClientMetadata_1.ClientMetadata({
                req
            });
            assertthat_1.assert.that(clientMetadata.token).is.equalTo('...');
        });
    });
    suite('user', () => {
        test('contains the user.', async () => {
            const claims = {}, id = uuid_1.v4(), req = {
                token: '...',
                user: { id, claims },
                connection: { remoteAddress: '127.0.0.1' },
                headers: {}
            };
            const clientMetadata = new ClientMetadata_1.ClientMetadata({
                req
            });
            assertthat_1.assert.that(clientMetadata.user).is.equalTo({ id, claims });
        });
    });
    suite('ip', () => {
        test('contains the remote address.', async () => {
            const req = {
                token: '...',
                user: { id: uuid_1.v4(), claims: {} },
                connection: { remoteAddress: '127.0.0.1' },
                headers: {}
            };
            const clientMetadata = new ClientMetadata_1.ClientMetadata({
                req
            });
            assertthat_1.assert.that(clientMetadata.ip).is.equalTo('127.0.0.1');
        });
        test('prefers the x-forwarded-for header if set.', async () => {
            const req = {
                token: '...',
                user: { id: uuid_1.v4(), claims: {} },
                connection: { remoteAddress: '127.0.0.1' },
                headers: { 'x-forwarded-for': '192.168.0.1' }
            };
            const clientMetadata = new ClientMetadata_1.ClientMetadata({
                req
            });
            assertthat_1.assert.that(clientMetadata.ip).is.equalTo('192.168.0.1');
        });
    });
});
//# sourceMappingURL=ClientMetadataTests.js.map