import path from 'path';
import setupApplication from '../../setupApplication';

const withDirectoriesWithoutIndex = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [
      'server/domain/sampleContext/*',
      'server/views/lists/*',
      'server/flows/*'
    ],
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

export default withDirectoriesWithoutIndex;
