import omit from 'lodash/omit';

import setupApplication from '../../setupApplication';

const packageJsonWithoutWolkenkit = async function (): Promise<string> {
  const directory = await setupApplication({
    configure (packageJson: any): any {
      return omit(packageJson, 'wolkenkit');
    }
  });

  return directory;
};

export default packageJsonWithoutWolkenkit;
