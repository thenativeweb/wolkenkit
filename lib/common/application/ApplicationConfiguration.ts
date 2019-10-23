import { CommandConfigurationInternal } from './CommandConfigurationInternal';
import { EventConfigurationInternal } from './EventConfigurationInternal';
import { InitialStateConfiguration } from './InitialStateConfiguration';

export interface ApplicationConfiguration {
  rootDirectory: string;

  domain: {
    [contextName: string]: {
      [aggregateName: string]: {
        initialState: InitialStateConfiguration;
        commands: Record<string, CommandConfigurationInternal>;
        events: Record<string, EventConfigurationInternal>;
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
