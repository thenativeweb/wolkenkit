export interface ApplicationConfigurationWeak {
  domain: {
    [contextName: string]: {
      [aggregateName: string]: any;
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
