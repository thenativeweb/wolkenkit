import setupApplication from '../../setupApplication';

const domainIsMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/domain' ]
  });

  return directory;
};

export default domainIsMissing;
