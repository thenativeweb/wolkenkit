"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQuery = void 0;
const getCallback = function (resolve, reject) {
    return function (err, rows, fields) {
        if (err) {
            return reject(err);
        }
        resolve([rows, fields]);
    };
};
const runQuery = async function ({ connection, query, parameters }) {
    if (parameters) {
        return await new Promise((resolve, reject) => {
            connection.query(query, parameters, getCallback(resolve, reject));
        });
    }
    return await new Promise((resolve, reject) => {
        connection.query(query, getCallback(resolve, reject));
    });
};
exports.runQuery = runQuery;
//# sourceMappingURL=runQuery.js.map