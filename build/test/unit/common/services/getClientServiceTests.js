"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getClientService_1 = require("../../../../lib/common/services/getClientService");
suite('getClientService', () => {
    test(`provides the client's token.`, async () => {
        const id = 'jane.doe';
        const clientService = getClientService_1.getClientService({
            clientMetadata: {
                token: '...',
                user: { id, claims: { sub: id } },
                ip: '127.0.0.1'
            }
        });
        assertthat_1.assert.that(clientService.token).is.equalTo('...');
    });
    test(`provides the client's user.`, async () => {
        const id = 'jane.doe';
        const clientService = getClientService_1.getClientService({
            clientMetadata: {
                token: '...',
                user: { id, claims: { sub: id } },
                ip: '127.0.0.1'
            }
        });
        assertthat_1.assert.that(clientService.user).is.equalTo({ id, claims: { sub: id } });
    });
    test(`provides the client's ip.`, async () => {
        const id = 'jane.doe';
        const clientService = getClientService_1.getClientService({
            clientMetadata: {
                token: '...',
                user: { id, claims: { sub: id } },
                ip: '127.0.0.1'
            }
        });
        assertthat_1.assert.that(clientService.ip).is.equalTo('127.0.0.1');
    });
});
//# sourceMappingURL=getClientServiceTests.js.map