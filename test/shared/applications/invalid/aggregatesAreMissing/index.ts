import setupApplication from '../../setupApplication';

const aggregatesAreMissing = async function (): Promise<string> {
  const directory = await setupApplication({
    remove: [ 'server/domain/sampleContext/*' ]
  });

  return directory;
};

export default aggregatesAreMissing;
