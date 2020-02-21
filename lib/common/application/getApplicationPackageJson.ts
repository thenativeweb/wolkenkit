import fs from 'fs';
import { getApplicationRoot } from './getApplicationRoot';
import { PackageManifest } from './PackageManifest';
import path from 'path';

const getApplicationPackageJson = async function ({ directory }: {
  directory: string;
}): Promise<PackageManifest> {
  const applicationRoot = await getApplicationRoot({ directory });
  const applicationPackageJsonPath = path.join(applicationRoot, 'package.json');

  const applicationPackageJson = await fs.promises.readFile(applicationPackageJsonPath, 'utf8');

  const packageManifest = JSON.parse(applicationPackageJson) as PackageManifest;

  return packageManifest;
};

export { getApplicationPackageJson };
