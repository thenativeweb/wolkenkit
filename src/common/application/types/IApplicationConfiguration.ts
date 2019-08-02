import { Dictionary } from '../../../types/Dictionary';
import { ICommandConfigurationInternal } from './ICommandConfigurationInternal';
import { IEventConfigurationInternal } from './IEventConfigurationInternal';
import { InitialStateConfiguration } from './InitialStateConfiguration';

export interface IApplicationConfiguration {
  domain: {
    [contextName: string]: {
      [aggregateName: string]: {
        initialState: InitialStateConfiguration;
        commands: Dictionary<string, ICommandConfigurationInternal>;
        events: Dictionary<string, IEventConfigurationInternal>;
      };
    };
  };

  views: {
    [modelType: string]: {
      [modelName: string]: any;
    };
  };

  flows: {
    [flowName: string]: any;
  };
}
