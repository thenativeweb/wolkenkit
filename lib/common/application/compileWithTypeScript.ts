import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { oneLine } from 'common-tags';
import path from 'path';
import { readdirRecursive } from '../utils/fs/readdirRecursive';
import { cp, exec, mkdir } from 'shelljs';

const compileWithTypeScript = async function ({
  sourceDirectory,
  targetDirectory
}: {
  sourceDirectory: string;
  targetDirectory: string;
}): Promise<void> {
  if (!await exists({ path: sourceDirectory })) {
    throw new errors.CompilationFailed('Source folder does not exist.');
  }

  const shellQuote = process.platform === 'win32' ? `"` : `'`;

  const { code, stdout, stderr } = exec(oneLine`
    npx tsc
      --module CommonJS
      --noEmitOnError
      --outDir ${shellQuote}${targetDirectory}${shellQuote}
  `, { cwd: sourceDirectory });

  if (code !== 0) {
    throw new errors.CompilationFailed('Compilation failed.', {
      data: { stdout, stderr }
    });
  }

  const { directories, files } = await readdirRecursive({ path: sourceDirectory });

  for (const directory of directories) {
    mkdir('-p', path.join(targetDirectory, directory));
  }

  const nonTypeScriptFiles = files.filter((file): boolean => path.extname(file) !== '.ts');

  for (const file of nonTypeScriptFiles) {
    const targetFile = path.join(targetDirectory, file);

    if (await exists({ path: targetFile })) {
      continue;
    }

    const sourceFile = path.join(sourceDirectory, file);

    cp(sourceFile, targetFile);
  }
};

export { compileWithTypeScript };
