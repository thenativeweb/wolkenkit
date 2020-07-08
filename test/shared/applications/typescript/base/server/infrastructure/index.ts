// @ts-ignore
import { AskInfrastructure, TellInfrastructure } from 'wolkenkit';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: {};
  tell: {};
}

const setupInfrastructure = async function (): Promise<void> {
  // Intentionally left blank.
};

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
  return {
    ask: {},
    tell: {}
  };
}

export default { getInfrastructure, setupInfrastructure }
