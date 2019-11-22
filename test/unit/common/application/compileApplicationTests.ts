import { assert } from 'assertthat';
import { compileWithTypeScript } from '../../../../lib/common/application/compileWithTypeScript';
import { CustomError } from 'defekt';
import fs from 'fs';
import { isolated } from 'isolated';
import path from 'path';
import { stripIndent } from 'common-tags';

suite('compileApplication', function (): void {
  this.timeout(10 * 1000);

  test('compiles successfully if the TypeScript code is correct.', async (): Promise<void> => {
    const typescriptFileContent = stripIndent`
      export const add = function (left: number, right: number): number {
        return left + right;
      };
    `;
    const tsconfigJson = {
      include: [
        './add.ts'
      ]
    };

    const sourceDirectory = await isolated();
    const targetDirectory = await isolated();

    await fs.promises.writeFile(path.join(sourceDirectory, 'add.ts'), typescriptFileContent, 'utf8');
    await fs.promises.writeFile(path.join(sourceDirectory, 'tsconfig.json'), JSON.stringify(tsconfigJson), 'utf8');
    await compileWithTypeScript({ sourceDirectory, targetDirectory });

    const actualJavascript = await fs.promises.readFile(path.join(targetDirectory, 'add.js'), 'utf8');
    const expectedJavascript = `${stripIndent`
      "use strict";
      exports.__esModule = true;
      exports.add = function (left, right) {
          return left + right;
      };
    `}\n`;

    assert.that(actualJavascript).is.equalTo(expectedJavascript);
  });

  test('compiles successfully if the target directory does not exist.', async (): Promise<void> => {
    const typescriptFileContent = stripIndent`
      export const add = function (left: number, right: number): number {
        return left + right;
      };
    `;
    const tsconfigJson = {
      include: [
        './add.ts'
      ]
    };

    const sourceDirectory = await isolated();
    const targetDirectory = path.join(await isolated(), 'does-not-exist');

    await fs.promises.writeFile(path.join(sourceDirectory, 'add.ts'), typescriptFileContent, 'utf8');
    await fs.promises.writeFile(path.join(sourceDirectory, 'tsconfig.json'), JSON.stringify(tsconfigJson), 'utf8');
    await compileWithTypeScript({ sourceDirectory, targetDirectory });

    const actualJavascript = await fs.promises.readFile(path.join(targetDirectory, 'add.js'), 'utf8');
    const expectedJavascript = `${stripIndent`
      "use strict";
      exports.__esModule = true;
      exports.add = function (left, right) {
          return left + right;
      };
    `}\n`;

    assert.that(actualJavascript).is.equalTo(expectedJavascript);
  });

  test('throws an error if the TypeScript code is broken.', async (): Promise<void> => {
    const typescriptFileContent = stripIndent`
      // number + number should not be a string
      export const add = function (left: number, right: number): string {
        return left + right;
      };
    `;
    const tsconfigJson = {
      include: [
        './add.ts'
      ]
    };

    const sourceDirectory = await isolated();
    const targetDirectory = await isolated();

    await fs.promises.writeFile(path.join(sourceDirectory, 'add.ts'), typescriptFileContent, 'utf8');
    await fs.promises.writeFile(path.join(sourceDirectory, 'tsconfig.json'), JSON.stringify(tsconfigJson), 'utf8');

    await assert.that(
      async (): Promise<void> => await compileWithTypeScript({ sourceDirectory, targetDirectory })
    ).is.throwingAsync(
      (ex): boolean =>
        (ex as CustomError).code === 'ECOMPILATIONFAILED' &&
        ex.message === 'Compilation failed.'
    );
  });

  test('throws an error if the source directory does not exist.', async (): Promise<void> => {
    const sourceDirectory = path.join(await isolated(), 'does-not-exist');
    const targetDirectory = await isolated();

    await assert.that(
      async (): Promise<void> => await compileWithTypeScript({
        sourceDirectory,
        targetDirectory
      })
    ).is.throwingAsync(
      (ex): boolean =>
        (ex as CustomError).code === 'ECOMPILATIONFAILED' &&
        ex.message === 'Source folder does not exist.'
    );
  });
});
