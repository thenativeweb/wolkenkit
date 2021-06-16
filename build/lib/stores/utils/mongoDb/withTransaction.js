"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = void 0;
const withTransaction = async function ({ client, fn }) {
    let result;
    await client.withSession({
        defaultTransactionOptions: {
            readPreference: 'primary',
            readConcern: { level: 'local' },
            // eslint-disable-next-line id-length
            writeConcern: { w: 'majority' }
        }
    }, async (session) => {
        await session.withTransaction(async () => {
            result = await fn({ session });
        });
    });
    return result;
};
exports.withTransaction = withTransaction;
//# sourceMappingURL=withTransaction.js.map