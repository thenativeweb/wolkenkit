import path from 'path';
import setupApplication from '../../setupApplication';

const withFilter = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [
      'server/domain/sampleContext/*',
      'server/views/lists/*'
    ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

export default withFilter;
