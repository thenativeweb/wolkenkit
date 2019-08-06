import setupApplication from '../../setupApplication';

const withoutLists = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/views/lists/*' ]
  });

  return directory;
};

export default withoutLists;
