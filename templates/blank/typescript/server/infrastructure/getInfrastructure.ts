import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
  return {
    ask: {},
    tell: {}
  };
}

export { getInfrastructure };
