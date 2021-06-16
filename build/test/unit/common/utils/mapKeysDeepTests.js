"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const mapKeysDeep_1 = require("../../../../lib/common/utils/mapKeysDeep");
suite('mapKeysDeep', () => {
    test('returns the given object with mapped keys.', async () => {
        const mappedObject = mapKeysDeep_1.mapKeysDeep({
            foo: 'bar',
            bar: 23
        }, (value, key) => key.toUpperCase());
        /* eslint-disable @typescript-eslint/naming-convention */
        assertthat_1.assert.that(mappedObject).is.equalTo({
            FOO: 'bar',
            BAR: 23
        });
        /* eslint-enable @typescript-eslint/naming-convention */
    });
    test('recursively maps keys.', async () => {
        const mappedObject = mapKeysDeep_1.mapKeysDeep({
            foo: 'bar',
            bar: {
                baz: 23
            }
        }, (value, key) => key.toUpperCase());
        /* eslint-disable @typescript-eslint/naming-convention */
        assertthat_1.assert.that(mappedObject).is.equalTo({
            FOO: 'bar',
            BAR: {
                BAZ: 23
            }
        });
        /* eslint-enable @typescript-eslint/naming-convention */
    });
    test('correctly handles array.', async () => {
        const mappedObject = mapKeysDeep_1.mapKeysDeep({
            foo: 'bar',
            bar: [23, 42]
        }, (value, key) => key.toUpperCase());
        /* eslint-disable @typescript-eslint/naming-convention */
        assertthat_1.assert.that(mappedObject).is.equalTo({
            FOO: 'bar',
            BAR: [23, 42]
        });
        /* eslint-enable @typescript-eslint/naming-convention */
    });
    test('ignores non-objects.', async () => {
        const mappedObject = mapKeysDeep_1.mapKeysDeep(23, (value, key) => key.toUpperCase());
        assertthat_1.assert.that(mappedObject).is.equalTo(23);
    });
});
//# sourceMappingURL=mapKeysDeepTests.js.map