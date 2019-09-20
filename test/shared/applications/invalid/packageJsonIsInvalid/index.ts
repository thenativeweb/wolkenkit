import path from 'path';
import setupApplication from '../../setupApplication';

const packageJsonIsInvalid = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'package.json' ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

export default packageJsonIsInvalid;
