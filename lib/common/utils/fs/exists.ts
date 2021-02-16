import fs from 'fs';
import { isErrnoException } from '../isErrnoException';

const exists = async function ({ path }: {
  path: string;
}): Promise<boolean> {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
  } catch (ex: unknown) {
    if (isErrnoException(ex) && ex.code === 'ENOENT') {
      return false;
    }

    throw ex;
  }

  return true;
};

export { exists };
