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
exports.validateContentType = void 0;
const content_type_1 = __importDefault(require("content-type"));
const errors = __importStar(require("../../common/errors"));
const validateContentType = function ({ expectedContentType, req }) {
    let contentType;
    try {
        contentType = content_type_1.default.parse(req);
    }
    catch (ex) {
        throw new errors.ContentTypeMismatch({ message: `Header content-type must be ${expectedContentType}.`, cause: ex });
    }
    if (contentType.type !== expectedContentType) {
        throw new errors.ContentTypeMismatch(`Header content-type must be ${expectedContentType}.`);
    }
};
exports.validateContentType = validateContentType;
//# sourceMappingURL=validateContentType.js.map