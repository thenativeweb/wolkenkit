"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionOptions = void 0;
const limes_1 = require("limes");
const getSubscriptionOptions = function ({ identityProviders, webSocketEndpoint, issuerForAnonymousTokens }) {
    const limes = new limes_1.Limes({ identityProviders });
    return {
        async onConnect(connectionParams, webSocket) {
            let clientMetadata;
            if (!connectionParams.token) {
                const payload = {
                    [`${issuerForAnonymousTokens}/is-anonymous`]: true
                };
                let subject = 'anonymous';
                if (connectionParams['x-anonymous-id']) {
                    subject += `-${connectionParams['x-anonymous-id']}`;
                }
                const anonymousToken = limes_1.Limes.issueUntrustedToken({
                    issuer: issuerForAnonymousTokens,
                    subject,
                    payload
                });
                clientMetadata = {
                    token: anonymousToken.token,
                    user: {
                        id: anonymousToken.decodedToken.sub,
                        claims: anonymousToken.decodedToken
                    },
                    ip: webSocket.upgradeReq.connection.remoteAddress
                };
            }
            else {
                const claims = await limes.verifyToken({ token: connectionParams.token });
                clientMetadata = {
                    token: connectionParams.token,
                    user: {
                        id: claims.sub,
                        claims
                    },
                    ip: webSocket.upgradeReq.connection.remoteAddress
                };
            }
            return { clientMetadata };
        },
        path: webSocketEndpoint
    };
};
exports.getSubscriptionOptions = getSubscriptionOptions;
//# sourceMappingURL=getSubscriptionOptions.js.map