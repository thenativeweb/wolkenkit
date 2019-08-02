export interface IApplicationConfigurationWeak {
  domain: {
    [contextName: string]: {
      [aggregateName: string]: any;
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
