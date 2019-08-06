import omit from 'lodash/omit';
import setupApplication from '../../setupApplication';

const packageJsonWithMissingRuntime = async function (): Promise<string> {
  const directory = await setupApplication({
    configure (packageJson: any): any {
      return omit(packageJson, 'wolkenkit.runtime');
    }
  });

  return directory;
};

export default packageJsonWithMissingRuntime;
