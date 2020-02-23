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

  const versions = /\d+\.\d+\.\d+/u.exec(from);

  if (!versions || versions.length === 0) {
    throw new errors.InvalidOperation(`Failed to extract version from '${dockerfilePath}'.`);
  }

  return versions[0];
};

export { getBaseImageVersionFromDockerfile };
