"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEnvironmentVariables = void 0;
const toEnvironmentVariables = function ({ configuration, configurationDefinition }) {
    const environmentVariables = {};
    for (const [key, rawDefinition] of Object.entries(configurationDefinition)) {
        const definition = rawDefinition;
        const value = configuration[key];
        if (typeof value === 'object') {
            environmentVariables[definition.environmentVariable] = JSON.stringify(value);
        }
        else {
            environmentVariables[definition.environmentVariable] = String(value);
        }
    }
    return environmentVariables;
};
exports.toEnvironmentVariables = toEnvironmentVariables;
//# sourceMappingURL=toEnvironmentVariables.js.map