import errors from '../errors';
import fs from 'fs';
import path from 'path';

const getApplicationRoot = async function ({ directory }: {
  directory: string;
}): Promise<string> {
  const wolkenkitConfigurationFile = path.join(directory, 'wolkenkit.json');

  try {
    await fs.promises.access(wolkenkitConfigurationFile, fs.constants.R_OK);
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
}

export default getApplicationRoot;
