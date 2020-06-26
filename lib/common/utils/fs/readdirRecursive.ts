import { errors } from '../../errors';
import fs from 'fs';
import { join } from 'path';

const readdirRecursive = async function ({ path }: {
  path: string;
}): Promise<{ directories: string[]; files: string[] }> {
  const directories: string[] = [];
  const files: string[] = [];

  const entries = await fs.promises.readdir(path, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      directories.push(entry.name);

      const directoryPath = join(path, entry.name);
      const { directories: subDirectories, files: subFiles } =
        await readdirRecursive({ path: directoryPath });

      for (const subDirectory of subDirectories) {
        directories.push(join(entry.name, subDirectory));
      }
      for (const subFile of subFiles) {
        files.push(join(entry.name, subFile));
      }
    } else if (entry.isFile()) {
      files.push(entry.name);
    } else {
      throw new errors.InvalidOperation();
    }
  }

  return { directories, files };
};

export { readdirRecursive };
