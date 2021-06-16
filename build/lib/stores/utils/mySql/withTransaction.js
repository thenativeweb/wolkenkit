"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = void 0;
const runQuery_1 = require("./runQuery");
const withTransaction = async function ({ getConnection, releaseConnection, fn }) {
    const connection = await getConnection();
    let result;
    try {
        await runQuery_1.runQuery({ connection, query: 'START TRANSACTION' });
        result = await fn({ connection });
        await runQuery_1.runQuery({ connection, query: 'COMMIT' });
    }
    catch (ex) {
        await runQuery_1.runQuery({ connection, query: 'ROLLBACK' });
        throw ex;
    }
    finally {
        if (releaseConnection) {
            await releaseConnection({ connection });
        }
    }
    return result;
};
exports.withTransaction = withTransaction;
//# sourceMappingURL=withTransaction.js.map