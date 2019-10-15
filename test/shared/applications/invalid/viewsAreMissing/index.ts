import setupApplication from '../../setupApplication';

const viewsIsMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/views' ]
  });

  return directory;
};

export default viewsIsMissing;
