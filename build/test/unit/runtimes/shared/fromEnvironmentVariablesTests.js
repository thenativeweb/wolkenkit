"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const fromEnvironmentVariables_1 = require("../../../../lib/runtimes/shared/fromEnvironmentVariables");
const nodeenv_1 = require("nodeenv");
suite('fromEnvironmentVariables', () => {
    test('reads environment variables according to a configuraton definition.', async () => {
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
        /* eslint-disable @typescript-eslint/naming-convention */
        const reset = nodeenv_1.nodeenv({
            FOO_ENV_VAR: 'foo',
            BAR: '5'
        });
        /* eslint-enable @typescript-eslint/naming-convention */
        const configuration = await fromEnvironmentVariables_1.fromEnvironmentVariables({ configurationDefinition });
        assertthat_1.assert.that(configuration).is.equalTo({
            foo: 'foo',
            bar: 5
        });
        reset();
    });
});
//# sourceMappingURL=fromEnvironmentVariablesTests.js.map