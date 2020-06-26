import { exists } from '../utils/fs/exists';
import path from 'path';
import { readdirRecursive } from '../utils/fs/readdirRecursive';
import { cp, mkdir } from 'shelljs';

const copyNonTypeScriptFiles = async function ({
  sourceDirectory,
  targetDirectory
}: {
  sourceDirectory: string;
  targetDirectory: string;
}): Promise<void> {
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

export { copyNonTypeScriptFiles };
