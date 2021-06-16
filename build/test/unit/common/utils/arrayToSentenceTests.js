"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const arrayToSentence_1 = require("../../../../lib/common/utils/arrayToSentence");
const assertthat_1 = require("assertthat");
suite('arrayToSentence', () => {
    test('returns an empty string for an empty array.', async () => {
        assertthat_1.assert.that(arrayToSentence_1.arrayToSentence({
            data: [],
            conjunction: 'and'
        })).is.equalTo('');
    });
    test('returns a string without commas and conjunction for an array with a single element.', async () => {
        assertthat_1.assert.that(arrayToSentence_1.arrayToSentence({
            data: ['red'],
            conjunction: 'and'
        })).is.equalTo('red');
    });
    test('returns a string with a conjunction for an array with two elements.', async () => {
        assertthat_1.assert.that(arrayToSentence_1.arrayToSentence({
            data: ['red', 'green'],
            conjunction: 'and'
        })).is.equalTo('red and green');
    });
    test('returns a string with commas and a conjunction for an array with more than two elements.', async () => {
        assertthat_1.assert.that(arrayToSentence_1.arrayToSentence({
            data: ['red', 'green', 'blue'],
            conjunction: 'and'
        })).is.equalTo('red, green, and blue');
    });
    test('uses the given prefix and suffix.', async () => {
        assertthat_1.assert.that(arrayToSentence_1.arrayToSentence({
            data: ['red', 'green', 'blue'],
            conjunction: 'and',
            itemPrefix: 'PREFIX',
            itemSuffix: 'SUFFIX'
        })).is.equalTo('PREFIXredSUFFIX, PREFIXgreenSUFFIX, and PREFIXblueSUFFIX');
    });
});
//# sourceMappingURL=arrayToSentenceTests.js.map