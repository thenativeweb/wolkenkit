import { getAvailablePorts } from './getAvailablePorts';

const getAvailablePort = async function (): Promise<number> {
  const [ availablePort ] = await getAvailablePorts({ count: 1 });

  return availablePort;
};

export { getAvailablePort };
