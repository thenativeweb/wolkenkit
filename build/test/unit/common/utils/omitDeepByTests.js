"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const omitDeepBy_1 = require("../../../../lib/common/utils/omitDeepBy");
suite('omitDeepBy', () => {
    test('returns the value if it is not an object.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy(23, (value) => value)).is.equalTo(23);
    });
    test('returns the value even for falsy values.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy(0, (value) => value)).is.equalTo(0);
    });
    test('returns the value even for undefined.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy(undefined, (value) => value)).is.undefined();
    });
    test('returns the value if it is an object.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy({ foo: 'bar' }, (value) => value === undefined)).is.equalTo({ foo: 'bar' });
    });
    test('omits properties that fulfill the predicate.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy({ foo: 'bar', bar: 'baz' }, (value) => value === 'bar')).is.equalTo({ bar: 'baz' });
    });
    test('omits undefined, but not null, if predicate checks for undefined.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy({ foo: null, bar: undefined }, (value) => value === undefined)).is.equalTo({ foo: null });
    });
    test('correctly handles empty arrays.', async () => {
        assertthat_1.assert.that(omitDeepBy_1.omitDeepBy({ bar: 'baz', foo: [] }, (value) => value === undefined)).is.equalTo({ bar: 'baz', foo: [] });
    });
});
//# sourceMappingURL=omitDeepByTests.js.map