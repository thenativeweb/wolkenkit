"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const toEnvironmentVariables_1 = require("../../../../lib/runtimes/shared/toEnvironmentVariables");
suite('toEnvironmentVariables', () => {
    test('builds a record of environment variables from a configuration and a configuration definition.', async () => {
        const configuration = {
            foo: 'baz',
            bar: { baz: 5 }
        };
        const configurationDefinition = {
            foo: {
                environmentVariable: 'FOO_ENV_VAR',
                defaultValue: 'bat',
                schema: { type: 'string' }
            },
            bar: {
                environmentVariable: 'BAR',
                defaultValue: { baz: 0 },
                schema: { type: 'object', properties: { baz: { type: 'number' } }, required: ['baz'], additionalProperties: false }
            }
        };
        const environmentVariables = toEnvironmentVariables_1.toEnvironmentVariables({ configuration, configurationDefinition });
        /* eslint-disable @typescript-eslint/naming-convention */
        assertthat_1.assert.that(environmentVariables).is.equalTo({
            FOO_ENV_VAR: 'baz',
            BAR: '{"baz":5}'
        });
        /* eslint-enable @typescript-eslint/naming-convention */
    });
});
//# sourceMappingURL=toEnvironmentVariablesTests.js.map