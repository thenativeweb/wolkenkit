import fs from 'fs';
import { PackageManifest } from '../../common/application/PackageManifest';
import { sortKeys } from '../../common/utils/sortKeys';
import wolkenkitPackageJson from '../../../package.json';

const adjustPackageJson = async function ({ packageJson, name }: {
  packageJson: string;
  name: string;
}): Promise<void> {
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
      ...content.devDependencies
    }
  });

  await fs.promises.writeFile(packageJson, JSON.stringify(content, null, 2), 'utf8');
};

export { adjustPackageJson };
