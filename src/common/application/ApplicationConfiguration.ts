import { CommandConfigurationInternal } from './CommandConfigurationInternal';
import { Dictionary } from '../../types/Dictionary';
import { EventConfigurationInternal } from './EventConfigurationInternal';
import { InitialStateConfiguration } from './InitialStateConfiguration';

export interface ApplicationConfiguration {
  domain: {
    [contextName: string]: {
      [aggregateName: string]: {
        initialState: InitialStateConfiguration;
        commands: Dictionary<CommandConfigurationInternal>;
        events: Dictionary<EventConfigurationInternal>;
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
