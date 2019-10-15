import setupApplication from '../../setupApplication';

const withoutFlows = async function (): Promise<string> {
  const directory = await setupApplication();

  return directory;
};

export default withoutFlows;
