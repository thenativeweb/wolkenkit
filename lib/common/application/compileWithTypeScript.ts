import { exec } from 'shelljs';
import { exists } from '../utils/fs/exists';
import { oneLine } from 'common-tags';
import * as errors from '../errors';

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
    throw new errors.CompilationFailed({ message: 'Compilation failed.', data: { stdout, stderr }});
  }
};

export { compileWithTypeScript };
