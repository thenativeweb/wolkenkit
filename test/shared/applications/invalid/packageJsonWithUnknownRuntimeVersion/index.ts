import cloneDeep from 'lodash/cloneDeep';

import setupApplication from '../../setupApplication';

const packageJsonWithUnknownRuntimeVersion = async function (): Promise<string> {
  const directory = await setupApplication({
    configure (packageJson: any): any {
      const configuredPackageJson = cloneDeep(packageJson);

      configuredPackageJson.wolkenkit.runtime.version = 'unknown.runtime.version';

      return configuredPackageJson;
    }
  });

  return directory;
};

export default packageJsonWithUnknownRuntimeVersion;
