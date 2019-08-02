import { Dictionary } from '../../../types/Dictionary';
import { InitialStateConfiguration } from './InitialStateConfiguration';

export interface IApplicationConfiguration {
  domain: {
    [contextName: string]: {
      [aggregateName: string]: {
        initialState: InitialStateConfiguration;
        commands: Dictionary<string, ICommandConfiguration>;
        events: Dictionary<string, IEventConfiguration>;
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
