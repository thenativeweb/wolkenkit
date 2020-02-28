import { errors } from '../../../../common/errors';
import fs from 'fs';

const getBaseImageVersionsFromDockerfile = async function ({ dockerfilePath, baseImage }: {
  dockerfilePath: string;
  baseImage: string;
}): Promise<{ line: number; version: string }[]> {
  const dockerfile = await fs.promises.readFile(dockerfilePath, 'utf8');

  const froms = dockerfile.
    split('\n').
    filter((line): boolean => line.startsWith(`FROM ${baseImage}:`));

  if (froms.length === 0) {
    throw new errors.InvalidOperation(`FROM statements are missing in '${dockerfilePath}'.`);
  }

  const result = froms.map((from, index): {
    line: number;
    version: string;
  } => ({
    line: index + 1,
    version: from.split(':')[1]
  }));

  return result;
};

export { getBaseImageVersionsFromDockerfile };
