import { CommandConfigurationInternal } from './CommandConfigurationInternal';
import { Dictionary } from '../../types/Dictionary';
import { EventConfigurationInternal } from './EventConfigurationInternal';
import { InitialStateConfiguration } from './InitialStateConfiguration';

export interface ApplicationConfiguration {
  rootDirectory: string;

  domain: {
    [contextName: string]: {
      [aggregateName: string]: {
        initialState: InitialStateConfiguration;
        commands: Dictionary<CommandConfigurationInternal>;
        events: Dictionary<EventConfigurationInternal>;
      } | undefined;
    } | undefined;
  };

  views: {
    [modelType: string]: {
      [modelName: string]: any;
    } | undefined;
  };

  flows: {
    [flowName: string]: any;
  };
}
