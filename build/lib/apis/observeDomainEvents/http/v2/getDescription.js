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
exports.getDescription = void 0;
const flaschenpost_1 = require("flaschenpost");
const getApplicationDescription_1 = require("../../../../common/application/getApplicationDescription");
const getDomainEventsDescriptionSchema_1 = require("../../../../common/schemas/getDomainEventsDescriptionSchema");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getDescription = {
    description: `Returns a description of the application's domain events.`,
    path: 'description',
    request: {},
    response: {
        statusCodes: [200],
        body: getDomainEventsDescriptionSchema_1.getDomainEventsDescriptionSchema()
    },
    getHandler({ application }) {
        const responseBodyParser = new validate_value_1.Parser(getDescription.response.body);
        const applicationDescription = getApplicationDescription_1.getApplicationDescription({ application });
        return function (req, res) {
            try {
                const response = applicationDescription.domainEvents;
                responseBodyParser.parse(response, { valueName: 'responseBody' }).unwrapOrThrow();
                res.send(response);
            }
            catch (ex) {
                const error = new errors.UnknownError({ cause: ex });
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api', 'observeDomainEvents', { error }));
                res.status(500).json({
                    code: error.code,
                    message: error.message
                });
            }
        };
    }
};
exports.getDescription = getDescription;
//# sourceMappingURL=getDescription.js.map