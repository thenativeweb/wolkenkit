import fs from 'fs';
import { sortKeys } from '../../common/utils/sortKeys';
import wolkenkitPackageJson from '../../../package.json';

interface PackageJson {
  name: string;
  version: string;
  description: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

const adjustPackageJson = async function ({ packageJson, name }: {
  packageJson: string;
  name: string;
}): Promise<void> {
  const content: PackageJson = JSON.parse(await fs.promises.readFile(packageJson, 'utf8'));

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
