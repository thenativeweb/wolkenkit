import omit from 'lodash/omit';

import setupApplication from '../../setupApplication';

const packageJsonWithoutNodeEnvironment = async function (): Promise<string> {
  const directory = await setupApplication({
    configure (packageJson: any): any {
      return omit(packageJson, 'wolkenkit.node.environment');
    }
  });

  return directory;
};

export default packageJsonWithoutNodeEnvironment;
