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
exports.createPublisher = void 0;
const HttpPublisher_1 = require("./Http/HttpPublisher");
const InMemoryPublisher_1 = require("./InMemory/InMemoryPublisher");
const errors = __importStar(require("../../common/errors"));
const createPublisher = async function (options) {
    switch (options.type) {
        case 'InMemory': {
            return await InMemoryPublisher_1.InMemoryPublisher.create(options);
        }
        case 'Http': {
            return await HttpPublisher_1.HttpPublisher.create(options);
        }
        default: {
            throw new errors.PublisherTypeInvalid();
        }
    }
};
exports.createPublisher = createPublisher;
//# sourceMappingURL=createPublisher.js.map