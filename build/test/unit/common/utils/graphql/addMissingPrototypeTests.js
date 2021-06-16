"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addMissingPrototype_1 = require("../../../../../lib/common/utils/graphql/addMissingPrototype");
const assertthat_1 = require("assertthat");
suite('addMissingPrototype', () => {
    test('adds a prototype if the prototype is null.', async () => {
        const withoutPrototype = Object.create(null);
        assertthat_1.assert.that(withoutPrototype.hasOwnProperty).is.undefined();
        const withPrototype = addMissingPrototype_1.addMissingPrototype({ value: withoutPrototype });
        // eslint-disable-next-line @typescript-eslint/unbound-method
        assertthat_1.assert.that(withPrototype.hasOwnProperty).is.ofType('function');
    });
});
//# sourceMappingURL=addMissingPrototypeTests.js.map