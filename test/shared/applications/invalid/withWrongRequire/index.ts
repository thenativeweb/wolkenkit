import path from 'path';
import setupApplication from '../../setupApplication';

const withWrongRequire = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/domain/sampleContext/*' ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

export default withWrongRequire;
