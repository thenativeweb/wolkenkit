import { assert } from 'assertthat';
import fs from 'fs';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('token', function (): void {
  this.timeout(30_000);

  test('issues a token.', async (): Promise<void> => {
    const directory = await isolated();
    const claimsFile = path.join(directory, 'claims.json');

    shell.exec('openssl genrsa 2048 > privateKey.pem', { cwd: directory });

    await fs.promises.writeFile(claimsFile, JSON.stringify({
      sub: 'jane.doe'
    }), { encoding: 'utf8' });

    const tokenCommand = `node ${cliPath} --verbose token --issuer https://token.invalid --private-key privateKey.pem --claims claims.json --expiration 10`;
    const { code, stdout } = shell.exec(tokenCommand, { cwd: directory });

    assert.that(code).is.equalTo(0);
    assert.that(stdout.includes('ey'));
    assert.that(stdout.includes('Issued a token.'));
  });
});
