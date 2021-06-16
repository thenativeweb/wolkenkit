"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const exists_1 = require("../../../../../lib/common/utils/fs/exists");
const path_1 = __importDefault(require("path"));
suite('exists', () => {
    test('returns true if the given file exists.', async () => {
        assertthat_1.assert.that(await exists_1.exists({ path: __filename })).is.true();
    });
    test('returns true if the given directory exists.', async () => {
        assertthat_1.assert.that(await exists_1.exists({ path: __dirname })).is.true();
    });
    test('returns false if the given path does not exist.', async () => {
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(__dirname, 'does', 'not', 'exist') })).is.false();
    });
});
//# sourceMappingURL=existsTests.js.map