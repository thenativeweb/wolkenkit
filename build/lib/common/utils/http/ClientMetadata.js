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
exports.ClientMetadata = void 0;
const lodash_1 = require("lodash");
const errors = __importStar(require("../../errors"));
class ClientMetadata {
    constructor({ req }) {
        var _a;
        if (!req.token || !req.user) {
            throw new errors.NotAuthenticated('Client information missing in request.');
        }
        this.token = req.token;
        this.user = { id: req.user.id, claims: req.user.claims };
        const headers = req.headers['x-forwarded-for'];
        const header = lodash_1.isArray(headers) ? headers[0] : headers;
        this.ip = (_a = header !== null && header !== void 0 ? header : req.connection.remoteAddress) !== null && _a !== void 0 ? _a : '0.0.0.0';
    }
}
exports.ClientMetadata = ClientMetadata;
//# sourceMappingURL=ClientMetadata.js.map