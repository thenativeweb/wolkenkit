import fs from 'fs';
import { getApplicationRoot } from '../../../common/application/getApplicationRoot';
import { PackageManifest } from '../../../common/application/PackageManifest';
import path from 'path';
import { sortKeys } from '../../../common/utils/sortKeys';
import { versions } from '../../../versions';

const adjustPackageJson = async function ({ packageJson, name, addTypeScript }: {
  packageJson: string;
  name: string;
  addTypeScript: boolean;
}): Promise<void> {
  const applicationRoot = await getApplicationRoot({ directory: __dirname });
  const wolkenkitPackageJsonPath = path.join(applicationRoot, 'package.json');
  const wolkenkitPackageJson: PackageManifest = JSON.parse(await fs.promises.readFile(wolkenkitPackageJsonPath, 'utf8'));

  const content: PackageManifest = JSON.parse(await fs.promises.readFile(packageJson, 'utf8'));

  content.name = name;
  content.description = `${name} is built with wolkenkit, an open-source CQRS and event-sourcing framework for JavaScript and Node.js.`;
  content.dependencies = sortKeys({
    object: {
      ...content.dependencies,
      wolkenkit: wolkenkitPackageJson.version
    }
  });
  content.devDependencies = sortKeys({
    object: {
      ...content.devDependencies,
      typescript: addTypeScript ? versions.packages.typescript : undefined
    }
  });

  await fs.promises.writeFile(packageJson, JSON.stringify(content, null, 2), 'utf8');
};

export { adjustPackageJson };
