import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { oneLine } from 'common-tags';
import path from 'path';
import { exec, mkdir } from 'shelljs';

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

  // Some directories may not contain TypeScript source files and are hence not
  // copied over by the TypeScript compiler, e.g. the flows directory. Since it
  // has to be there for the application loading process to succeed, we need to
  // verify that these directories exist, and if not, create them manually as
  // empty ones.
  const flowsDirectory = path.join(targetDirectory, 'server', 'flows');

  if (!await exists({ path: flowsDirectory })) {
    mkdir('-p', flowsDirectory);
  }
};

export { compileWithTypeScript };
