import { errors } from '../errors';
import fs from 'fs';
import path from 'path';

const getApplicationRoot = async function ({ directory }: {
  directory: string;
}): Promise<string> {
  try {
    await fs.promises.access(directory, fs.constants.R_OK);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      throw new errors.DirectoryNotFound();
    }

    throw ex;
  }

  const packageJsonPath = path.join(directory, 'package.json');

  try {
    await fs.promises.access(packageJsonPath, fs.constants.R_OK);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      const upperDirectory = path.join(directory, '..');

      if (upperDirectory === directory) {
        throw new errors.ApplicationNotFound();
      }

      return await getApplicationRoot({ directory: upperDirectory });
    }

    throw ex;
  }

  return directory;
};

export { getApplicationRoot };
