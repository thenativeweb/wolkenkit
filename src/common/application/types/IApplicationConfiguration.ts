import { ICommandConfigurationInternal } from './ICommandConfigurationInternal';
import { IDictionary } from '../../../types/IDictionary';
import { IEventConfigurationInternal } from './IEventConfigurationInternal';
import { InitialStateConfiguration } from './InitialStateConfiguration';

export interface IApplicationConfiguration {
  domain: {
    [contextName: string]: {
      [aggregateName: string]: {
        initialState: InitialStateConfiguration;
        commands: IDictionary<ICommandConfigurationInternal>;
        events: IDictionary<IEventConfigurationInternal>;
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
