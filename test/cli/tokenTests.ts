import { assert } from 'assertthat';
import fs from 'fs';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('token', function (): void {
  this.timeout(30_000);

  let claimsFile: string,
      directory: string;

  setup(async (): Promise<void> => {
    directory = await isolated();
    claimsFile = path.join(directory, 'claims.json');

    shell.exec('openssl genrsa 2048 > privateKey.pem', { cwd: directory });

    await fs.promises.writeFile(claimsFile, JSON.stringify({
      sub: 'jane.doe'
    }), { encoding: 'utf8' });
  });

  test('issues a token.', async (): Promise<void> => {
    const tokenCommand = `node ${cliPath} --verbose token --issuer https://token.invalid --private-key privateKey.pem --claims claims.json --expiration 10`;
    const { code, stdout } = shell.exec(tokenCommand, { cwd: directory });

    assert.that(code).is.equalTo(0);
    assert.that(stdout.includes('ey')).is.true();
    assert.that(stdout.includes('Issued a token.')).is.true();
  });

  test('only output the token if --raw is set.', async (): Promise<void> => {
    const tokenCommand = `node ${cliPath} --verbose token --issuer https://token.invalid --private-key privateKey.pem --claims claims.json --expiration 10 --raw`;
    const { code, stdout } = shell.exec(tokenCommand, { cwd: directory });

    assert.that(code).is.equalTo(0);
    assert.that(stdout.startsWith('ey')).is.true();
    assert.that(stdout.includes('Issued a token.')).is.false();
  });
});
