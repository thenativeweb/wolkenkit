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
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const validateQueryHandlerIdentifier_1 = require("../../../../lib/common/validators/validateQueryHandlerIdentifier");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('validateQueryHandlerIdentifier', () => {
    const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
    const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'all'
    };
    let application;
    suiteSetup(async () => {
        application = await loadApplication_1.loadApplication({ applicationDirectory });
    });
    test('does not throw an error if everything is fine.', async () => {
        assertthat_1.assert.that(() => {
            validateQueryHandlerIdentifier_1.validateQueryHandlerIdentifier({ queryHandlerIdentifier, application });
        }).is.not.throwing();
    });
    test(`throws an error if the query handler identifier's view doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateQueryHandlerIdentifier_1.validateQueryHandlerIdentifier({
                queryHandlerIdentifier: {
                    ...queryHandlerIdentifier,
                    view: { name: 'someView' }
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.ViewNotFound.code &&
            ex.message === `View 'someView' not found.`);
    });
    test(`throws an error if the query handler identifier's name doesn't exist in the application definition.`, async () => {
        assertthat_1.assert.that(() => {
            validateQueryHandlerIdentifier_1.validateQueryHandlerIdentifier({
                queryHandlerIdentifier: {
                    ...queryHandlerIdentifier,
                    name: 'someQueryHandler'
                },
                application
            });
        }).is.throwing((ex) => ex.code === errors.QueryHandlerNotFound.code &&
            ex.message === `Query handler 'sampleView.someQueryHandler' not found.`);
    });
});
//# sourceMappingURL=validateQueryHandlerIdentifierTests.js.map