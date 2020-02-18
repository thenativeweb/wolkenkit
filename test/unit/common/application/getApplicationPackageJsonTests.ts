import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import fs from 'fs';
import { getApplicationPackageJson } from '../../../../lib/common/application/getApplicationPackageJson';
import { isolated } from 'isolated';
import path from 'path';

suite('getApplicationPackageJson', (): void => {
  test('returns the package.json from the given directory if it contains a package.json file.', async (): Promise<void> => {
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

    const applicationPackageJson = await getApplicationPackageJson({ directory });

    assert.that(applicationPackageJson).is.equalTo({
      name: 'test',
      version: '1.0.0'
    });
  });

  test('returns the package.json from the parent directory if the directory does not contain a package.json file, but the parent does.', async (): Promise<void> => {
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

    const applicationPackageJson = await getApplicationPackageJson({ directory: subDirectory });

    assert.that(applicationPackageJson).is.equalTo({
      name: 'test',
      version: '1.0.0'
    });
  });

  test('throws an error if no package.json can be found.', async (): Promise<void> => {
    const directory = await isolated();

    await assert.that(async (): Promise<void> => {
      await getApplicationPackageJson({ directory });
    }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'EAPPLICATIONNOTFOUND');
  });

  test('throws an error if the given directory does not exist.', async (): Promise<void> => {
    await assert.that(async (): Promise<void> => {
      await getApplicationPackageJson({ directory: path.join(__dirname, 'does', 'not', 'exist') });
    }).is.throwingAsync((ex): boolean => (ex as CustomError).code === 'EDIRECTORYNOTFOUND');
  });
});
