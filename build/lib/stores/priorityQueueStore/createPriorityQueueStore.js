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
exports.createPriorityQueueStore = void 0;
const InMemory_1 = require("./InMemory");
const MongoDb_1 = require("./MongoDb");
const MySql_1 = require("./MySql");
const Postgres_1 = require("./Postgres");
const SqlServer_1 = require("./SqlServer");
const errors = __importStar(require("../../common/errors"));
const createPriorityQueueStore = async function (options) {
    switch (options.type) {
        case 'InMemory': {
            return await InMemory_1.InMemoryPriorityQueueStore.create(options);
        }
        case 'MariaDb': {
            return await MySql_1.MySqlPriorityQueueStore.create(options);
        }
        case 'MongoDb': {
            return await MongoDb_1.MongoDbPriorityQueueStore.create(options);
        }
        case 'MySql': {
            return await MySql_1.MySqlPriorityQueueStore.create(options);
        }
        case 'Postgres': {
            return await Postgres_1.PostgresPriorityQueueStore.create(options);
        }
        case 'SqlServer': {
            return await SqlServer_1.SqlServerPriorityQueueStore.create(options);
        }
        default: {
            throw new errors.DatabaseTypeInvalid();
        }
    }
};
exports.createPriorityQueueStore = createPriorityQueueStore;
//# sourceMappingURL=createPriorityQueueStore.js.map