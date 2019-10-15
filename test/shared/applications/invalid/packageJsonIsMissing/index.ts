import setupApplication from '../../setupApplication';

const packageJsonIsMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'package.json' ]
  });

  return directory;
};

export default packageJsonIsMissing;
