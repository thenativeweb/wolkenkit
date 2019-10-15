import setupApplication from '../../setupApplication';

const contextsAreMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/domain/*' ]
  });

  return directory;
};

export default contextsAreMissing;
