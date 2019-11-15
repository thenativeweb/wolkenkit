import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import fs from 'fs';
import { getApplicationRoot } from '../../../../lib/common/application/getApplicationRoot';
import { isolated } from 'isolated';
import path from 'path';

suite('getApplicationRoot', (): void => {
  test('returns the given directory if it contains a package.json file.', async (): Promise<void> => {
    const directory = await isolated();
    const packageJsonPath = path.join(directory, 'package.json');

    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify({
        name: 'test',
        version: '1.0.0'
      }),
      'utf8'
    );

    const applicationRoot = await getApplicationRoot({ directory });

    assert.that(applicationRoot).is.equalTo(directory);
  });

  test('returns the parent directory if the directory does not contain a package.json file, but the parent does.', async (): Promise<void> => {
    const directory = await isolated();
    const subDirectory = path.join(directory, 'subDirectory');

    await fs.promises.mkdir(subDirectory);

    const packageJsonPath = path.join(directory, 'package.json');

    await fs.promises.writeFile(
      packageJsonPath,
      JSON.stringify({
        name: 'test',
        version: '1.0.0'
      }),
      'utf8'
    );

    const applicationRoot = await getApplicationRoot({ directory: subDirectory });

    assert.that(applicationRoot).is.equalTo(directory);
  });

  test('throws an error if no package.json can be found.', async (): Promise<void> => {
    const directory = await isolated();

    await assert.that(async (): Promise<void> => {
      await getApplicationRoot({ directory });
    }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'EAPPLICATIONNOTFOUND');
  });

  test('throws an error if the given directory does not exist.', async (): Promise<void> => {
    await assert.that(async (): Promise<void> => {
      await getApplicationRoot({ directory: path.join(__dirname, 'does', 'not', 'exist') });
    }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'EDIRECTORYNOTFOUND');
  });
});
