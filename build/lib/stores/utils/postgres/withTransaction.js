"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = void 0;
const withTransaction = async function ({ getConnection, releaseConnection, fn }) {
    const connection = await getConnection();
    let result;
    try {
        await connection.query('BEGIN');
        result = await fn({ connection });
        await connection.query('COMMIT');
    }
    catch (ex) {
        await connection.query('ROLLBACK');
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