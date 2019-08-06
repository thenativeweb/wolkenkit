import setupApplication from '../../setupApplication';

const listsAreMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/views/lists' ]
  });

  return directory;
};

export default listsAreMissing;
