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
exports.getSnapshotStrategy = void 0;
const errors = __importStar(require("../errors"));
const getSnapshotStrategy = function (snapshotStrategyConfiguration) {
    switch (snapshotStrategyConfiguration.name) {
        case 'lowest': {
            const { durationLimit, revisionLimit } = snapshotStrategyConfiguration.configuration;
            return ({ replayDuration, replayedDomainEvents }) => replayDuration >= durationLimit || replayedDomainEvents >= revisionLimit;
        }
        case 'revision': {
            const { revisionLimit } = snapshotStrategyConfiguration.configuration;
            return ({ replayedDomainEvents }) => replayedDomainEvents >= revisionLimit;
        }
        case 'duration': {
            const { durationLimit } = snapshotStrategyConfiguration.configuration;
            return ({ replayDuration }) => replayDuration >= durationLimit;
        }
        case 'always': {
            return () => true;
        }
        case 'never': {
            return () => false;
        }
        default: {
            throw new errors.InvalidOperation();
        }
    }
};
exports.getSnapshotStrategy = getSnapshotStrategy;
//# sourceMappingURL=getSnapshotStrategy.js.map