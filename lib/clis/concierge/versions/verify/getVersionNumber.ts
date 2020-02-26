import { errors } from '../../../../common/errors';

const getVersionNumber = function ({ version }: {
  version: string;
}): string {
  // Check for version of form 'x.y.z'.
  let versions = /\d+\.\d+\.\d+/u.exec(version);

  if (versions && versions.length > 0) {
    return versions[0];
  }

  // Check for version of form 'x.y'.
  versions = /\d+\.\d+/u.exec(version);

  if (versions && versions.length > 0) {
    return versions[0];
  }

  throw new errors.InvalidOperation(`Failed to extract version number from '${version}'.`);
};

export { getVersionNumber };
