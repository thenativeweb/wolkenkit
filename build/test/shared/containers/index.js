"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlServer = exports.redis = exports.postgres = exports.mySql = exports.mongoDb = exports.minio = exports.mariaDb = void 0;
const mariaDb_1 = require("./mariaDb");
Object.defineProperty(exports, "mariaDb", { enumerable: true, get: function () { return mariaDb_1.mariaDb; } });
const minio_1 = require("./minio");
Object.defineProperty(exports, "minio", { enumerable: true, get: function () { return minio_1.minio; } });
const mongoDb_1 = require("./mongoDb");
Object.defineProperty(exports, "mongoDb", { enumerable: true, get: function () { return mongoDb_1.mongoDb; } });
const mySql_1 = require("./mySql");
Object.defineProperty(exports, "mySql", { enumerable: true, get: function () { return mySql_1.mySql; } });
const postgres_1 = require("./postgres");
Object.defineProperty(exports, "postgres", { enumerable: true, get: function () { return postgres_1.postgres; } });
const redis_1 = require("./redis");
Object.defineProperty(exports, "redis", { enumerable: true, get: function () { return redis_1.redis; } });
const sqlServer_1 = require("./sqlServer");
Object.defineProperty(exports, "sqlServer", { enumerable: true, get: function () { return sqlServer_1.sqlServer; } });
//# sourceMappingURL=index.js.map