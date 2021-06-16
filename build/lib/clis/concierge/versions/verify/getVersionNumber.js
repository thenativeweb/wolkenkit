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
exports.getVersionNumber = void 0;
const errors = __importStar(require("../../../../common/errors"));
const getVersionNumber = function ({ version }) {
    // Check for version of form 'x.y.z'.
    let versions = /\d+\.\d+\.\d+/u.exec(version);
    if (versions && versions.length > 0) {
        return versions[0];
    }
    // Check for version of form 'x.y'.
    versions = /\d+\.\d+/u.exec(version);
    if (versions && versions.length > 0) {
        return versions[0];
    }
    throw new errors.InvalidOperation(`Failed to extract version number from '${version}'.`);
};
exports.getVersionNumber = getVersionNumber;
//# sourceMappingURL=getVersionNumber.js.map