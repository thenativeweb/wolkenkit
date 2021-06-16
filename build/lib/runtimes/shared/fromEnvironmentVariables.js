"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEnvironmentVariables = void 0;
const validate_value_1 = require("validate-value");
const processenv_1 = require("processenv");
const fromEnvironmentVariables = async function ({ configurationDefinition }) {
    const configuration = {};
    for (const [key, rawDefinition] of Object.entries(configurationDefinition)) {
        const definition = rawDefinition;
        const value = await processenv_1.processenv(definition.environmentVariable, definition.defaultValue);
        validate_value_1.parse(value, definition.schema, { valueName: key }).unwrapOrThrow();
        if (value === undefined) {
            throw new Error(`Required environment variable '${definition.environmentVariable}' is not set.`);
        }
        configuration[key] = value;
    }
    return configuration;
};
exports.fromEnvironmentVariables = fromEnvironmentVariables;
//# sourceMappingURL=fromEnvironmentVariables.js.map