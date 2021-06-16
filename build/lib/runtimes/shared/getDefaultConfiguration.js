"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConfiguration = void 0;
const getDefaultConfiguration = function ({ configurationDefinition }) {
    const configuration = {};
    for (const [key, rawDefinition] of Object.entries(configurationDefinition)) {
        const definition = rawDefinition;
        configuration[key] = definition.defaultValue;
    }
    return configuration;
};
exports.getDefaultConfiguration = getDefaultConfiguration;
//# sourceMappingURL=getDefaultConfiguration.js.map