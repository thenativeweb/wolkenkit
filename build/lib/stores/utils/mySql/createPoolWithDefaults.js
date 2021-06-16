"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoolWithDefaults = void 0;
const mysql_1 = require("mysql");
const createPoolWithDefaults = function ({ hostName, port, userName, password, database }) {
    return mysql_1.createPool({
        host: hostName,
        port,
        user: userName,
        password,
        database,
        connectTimeout: 0,
        multipleStatements: true,
        charset: 'utf8mb4'
    });
};
exports.createPoolWithDefaults = createPoolWithDefaults;
//# sourceMappingURL=createPoolWithDefaults.js.map