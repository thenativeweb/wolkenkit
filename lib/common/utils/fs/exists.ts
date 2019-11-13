import fs from 'fs';

const exists = async function ({ path }: {
  path: string;
}): Promise<boolean> {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      return false;
    }

    throw ex;
  }

  return true;
};

export { exists };
