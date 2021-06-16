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
exports.createDomainEventStore = void 0;
const InMemory_1 = require("./InMemory");
const MongoDb_1 = require("./MongoDb");
const MySql_1 = require("./MySql");
const Postgres_1 = require("./Postgres");
const SqlServer_1 = require("./SqlServer");
const errors = __importStar(require("../../common/errors"));
const createDomainEventStore = async function (options) {
    switch (options.type) {
        case 'InMemory': {
            return InMemory_1.InMemoryDomainEventStore.create(options);
        }
        case 'MariaDb': {
            return MySql_1.MySqlDomainEventStore.create(options);
        }
        case 'MongoDb': {
            return MongoDb_1.MongoDbDomainEventStore.create(options);
        }
        case 'MySql': {
            return MySql_1.MySqlDomainEventStore.create(options);
        }
        case 'Postgres': {
            return Postgres_1.PostgresDomainEventStore.create(options);
        }
        case 'SqlServer': {
            return SqlServer_1.SqlServerDomainEventStore.create(options);
        }
        default: {
            throw new errors.DatabaseTypeInvalid();
        }
    }
};
exports.createDomainEventStore = createDomainEventStore;
//# sourceMappingURL=createDomainEventStore.js.map