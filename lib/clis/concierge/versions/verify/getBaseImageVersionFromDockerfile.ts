import { errors } from '../../../../common/errors';
import fs from 'fs';

const getBaseImageVersionFromDockerfile = async function ({ dockerfilePath }: {
  dockerfilePath: string;
}): Promise<string> {
  const dockerfile = await fs.promises.readFile(dockerfilePath, 'utf8');

  const from = dockerfile.split('\n').find((line): boolean => line.startsWith('FROM'));

  if (!from) {
    throw new errors.InvalidOperation(`FROM statement is missing in '${dockerfilePath}'.`);
  }

  const [ , version ] = from.split(':');

  if (!version) {
    throw new errors.InvalidOperation(`Failed to extract version from '${dockerfilePath}'.`);
  }

  return version;
};

export { getBaseImageVersionFromDockerfile };
