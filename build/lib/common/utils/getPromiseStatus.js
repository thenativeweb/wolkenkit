"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromiseStatus = void 0;
const getPromiseStatus = async function (promise) {
    const value = {};
    try {
        const result = await Promise.race([promise, value]);
        if (result === value) {
            return 'pending';
        }
        return 'resolved';
    }
    catch {
        return 'rejected';
    }
};
exports.getPromiseStatus = getPromiseStatus;
//# sourceMappingURL=getPromiseStatus.js.map