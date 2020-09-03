import { assert } from 'assertthat';
import { fileExists } from 'next/dist/lib/file-exists';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

suite('setup store file file-system', function (): void {
  this.timeout(30_000);

  test(`sets up a file system for the file store.`, async (): Promise<void> => {
    const temporaryDirectory = await isolated();
    const storeDirectory = path.join(temporaryDirectory, 'fileStore');

    const setupS3FileStoreCommand = `node ${cliPath} --verbose setup store file file-system --directory ${storeDirectory}`;
    const { stdout } = shell.exec(setupS3FileStoreCommand, { silent: false });

    assert.that(stdout).is.containing('Successfully set up the file-system file store.');

    await fileExists(storeDirectory);
  });
});
