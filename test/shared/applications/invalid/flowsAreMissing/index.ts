import setupApplication from '../../setupApplication';

const flowsAreMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/flows' ]
  });

  return directory;
};

export default flowsAreMissing;
