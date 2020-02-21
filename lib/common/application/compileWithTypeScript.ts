import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { oneLine } from 'common-tags';
import shell from 'shelljs';

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

  const { code, stdout, stderr } = shell.exec(oneLine`
    npx tsc
      --module CommonJS
      --noEmitOnError
      --outDir '${targetDirectory}'
  `, { cwd: sourceDirectory });

  if (code !== 0) {
    throw new errors.CompilationFailed('Compilation failed.', {
      data: { stdout, stderr }
    });
  }
};

export { compileWithTypeScript };
