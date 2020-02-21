import untildify from 'untildify';
import { isAbsolute, join } from 'path';

const getAbsolutePath = function ({ path, cwd }: {
  path: string;
  cwd: string;
}): string {
  const untilfiedPath = untildify(path);

  if (isAbsolute(untilfiedPath)) {
    return untilfiedPath;
  }

  const absolutePath = join(cwd, path);

  return absolutePath;
};

export { getAbsolutePath };
