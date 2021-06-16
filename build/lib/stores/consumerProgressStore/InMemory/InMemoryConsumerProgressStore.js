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
exports.InMemoryConsumerProgressStore = void 0;
const errors = __importStar(require("../../../common/errors"));
class InMemoryConsumerProgressStore {
    constructor() {
        this.progress = {};
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async create(options) {
        return new InMemoryConsumerProgressStore();
    }
    async getProgress({ consumerId, aggregateIdentifier }) {
        var _a, _b, _c, _d, _e, _f;
        return {
            revision: (_c = (_b = (_a = this.progress[consumerId]) === null || _a === void 0 ? void 0 : _a[aggregateIdentifier.aggregate.id]) === null || _b === void 0 ? void 0 : _b.revision) !== null && _c !== void 0 ? _c : 0,
            isReplaying: (_f = (_e = (_d = this.progress[consumerId]) === null || _d === void 0 ? void 0 : _d[aggregateIdentifier.aggregate.id]) === null || _e === void 0 ? void 0 : _e.isReplaying) !== null && _f !== void 0 ? _f : false
        };
    }
    async setProgress({ consumerId, aggregateIdentifier, revision }) {
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        if (!this.progress[consumerId]) {
            this.progress[consumerId] = {};
        }
        if (!this.progress[consumerId][aggregateIdentifier.aggregate.id]) {
            this.progress[consumerId][aggregateIdentifier.aggregate.id] = { revision: 0, isReplaying: false };
        }
        if (revision <= this.progress[consumerId][aggregateIdentifier.aggregate.id].revision) {
            throw new errors.RevisionTooLow();
        }
        this.progress[consumerId][aggregateIdentifier.aggregate.id].revision = revision;
    }
    async setIsReplaying({ consumerId, aggregateIdentifier, isReplaying }) {
        if (isReplaying) {
            if (isReplaying.from < 1) {
                throw new errors.ParameterInvalid('Replays must start from at least one.');
            }
            if (isReplaying.from > isReplaying.to) {
                throw new errors.ParameterInvalid('Replays must start at an earlier revision than where they end at.');
            }
        }
        if (!this.progress[consumerId]) {
            this.progress[consumerId] = {};
        }
        if (!this.progress[consumerId][aggregateIdentifier.aggregate.id]) {
            this.progress[consumerId][aggregateIdentifier.aggregate.id] = { revision: 0, isReplaying: false };
        }
        if (this.progress[consumerId][aggregateIdentifier.aggregate.id].isReplaying !== false) {
            throw new errors.FlowIsAlreadyReplaying();
        }
        this.progress[consumerId][aggregateIdentifier.aggregate.id].isReplaying = isReplaying;
    }
    async resetProgress({ consumerId }) {
        Reflect.deleteProperty(this.progress, consumerId);
    }
    async resetProgressToRevision({ consumerId, aggregateIdentifier, revision }) {
        if (revision < 0) {
            throw new errors.ParameterInvalid('Revision must be at least zero.');
        }
        if (!this.progress[consumerId]) {
            return;
        }
        if (!this.progress[consumerId][aggregateIdentifier.aggregate.id]) {
            return;
        }
        const progress = this.progress[consumerId][aggregateIdentifier.aggregate.id];
        if (progress.revision < revision) {
            throw new errors.ParameterInvalid('Can not reset a consumer to a newer revision than it currently is at.');
        }
        progress.revision = revision;
        progress.isReplaying = false;
    }
    // eslint-disable-next-line class-methods-use-this
    async setup() {
        // Intentionally left blank.
    }
    async destroy() {
        this.progress = {};
    }
}
exports.InMemoryConsumerProgressStore = InMemoryConsumerProgressStore;
//# sourceMappingURL=InMemoryConsumerProgressStore.js.map