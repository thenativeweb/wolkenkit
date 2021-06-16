"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const getDefaultConfiguration_1 = require("../../../../lib/runtimes/shared/getDefaultConfiguration");
suite('getDefaultConfiguration', () => {
    test('retrieves the default values from a configuration definition.', async () => {
        const configurationDefinition = {
            foo: {
                environmentVariable: 'FOO_ENV_VAR',
                defaultValue: 'bat',
                schema: { type: 'string' }
            },
            bar: {
                environmentVariable: 'BAR',
                defaultValue: 0,
                schema: { type: 'number' }
            }
        };
        const configuration = getDefaultConfiguration_1.getDefaultConfiguration({ configurationDefinition });
        assertthat_1.assert.that(configuration).is.equalTo({
            foo: 'bat',
            bar: 0
        });
    });
});
//# sourceMappingURL=getDefaultConfigurationTests.js.map