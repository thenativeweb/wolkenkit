"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setupInfrastructure = async function () {
    // Intentionally left blank.
};
const getInfrastructure = async function () {
    const domainEvents = [];
    return {
        ask: {
            viewStore: {
                domainEvents
            }
        },
        tell: {
            viewStore: {
                domainEvents
            }
        }
    };
};
exports.default = { getInfrastructure, setupInfrastructure };
//# sourceMappingURL=index.js.map