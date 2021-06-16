"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const fs_1 = __importDefault(require("fs"));
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const rootPath = path_1.default.join(__dirname, '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('token', function () {
    this.timeout(30000);
    let claimsFile, directory;
    setup(async () => {
        directory = await isolated_1.isolated();
        claimsFile = path_1.default.join(directory, 'claims.json');
        shelljs_1.default.exec('openssl genrsa 2048 > privateKey.pem', { cwd: directory });
        await fs_1.default.promises.writeFile(claimsFile, JSON.stringify({
            sub: 'jane.doe'
        }), { encoding: 'utf8' });
    });
    test('issues a token.', async () => {
        const tokenCommand = `node ${cliPath} --verbose token --issuer https://token.invalid --private-key privateKey.pem --claims claims.json --expiration 10`;
        const { code, stdout } = shelljs_1.default.exec(tokenCommand, { cwd: directory });
        assertthat_1.assert.that(code).is.equalTo(0);
        assertthat_1.assert.that(stdout.includes('ey')).is.true();
        assertthat_1.assert.that(stdout.includes('Issued a token.')).is.true();
    });
    test('only output the token if --raw is set.', async () => {
        const tokenCommand = `node ${cliPath} --verbose token --issuer https://token.invalid --private-key privateKey.pem --claims claims.json --expiration 10 --raw`;
        const { code, stdout } = shelljs_1.default.exec(tokenCommand, { cwd: directory });
        assertthat_1.assert.that(code).is.equalTo(0);
        assertthat_1.assert.that(stdout.startsWith('ey')).is.true();
        assertthat_1.assert.that(stdout.includes('Issued a token.')).is.false();
    });
});
//# sourceMappingURL=tokenTests.js.map