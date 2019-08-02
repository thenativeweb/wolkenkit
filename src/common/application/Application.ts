import ApplicationCache from './ApplicationCache';
import commonTags from 'common-tags';
import { Dictionary } from '../../types/Dictionary';
import extendApplicationConfiguration from './extendApplicationConfiguration';
import getApplicationConfiguration from './getApplicationConfiguration';
import { IApplicationConfiguration } from './types/IApplicationConfiguration';
import { ICommandConfigurationExternal } from './types/ICommandConfigurationExternal';
import { ICommandConfigurationInternal } from './types/ICommandConfigurationInternal';
import { IEventConfigurationExternal } from './types/IEventConfigurationExternal';
import { IEventConfigurationInternal } from './types/IEventConfigurationInternal';
import { InitialStateConfiguration } from './types/InitialStateConfiguration';
import validateApplicationConfiguration from './validateApplicationConfiguration';
import validateDirectory from './validateDirectory';
import { pick, set } from 'lodash';

const { stripIndent } = commonTags;

class Application {
  private static cache = new ApplicationCache();

  public readonly initialState: {
    internal: Dictionary<string, Dictionary<string, InitialStateConfiguration>>;
  }

  public readonly commands: {
    internal: Dictionary<string, Dictionary<string, Dictionary<string, ICommandConfigurationInternal>>>;
    external: Dictionary<string, Dictionary<string, Dictionary<string, ICommandConfigurationExternal>>>;
  }

  public readonly events: {
    internal: Dictionary<string, Dictionary<string, Dictionary<string, IEventConfigurationInternal>>>;
    external: Dictionary<string, Dictionary<string, Dictionary<string, IEventConfigurationExternal>>>;
  }

  public readonly views: {
    internal: Dictionary<string, Dictionary<string, Dictionary<string, Todo>>>;
    external: Dictionary<string, Dictionary<string, Dictionary<string, Todo>>>;
  }

  public readonly flows: {
    internal: Dictionary<string, Dictionary<string, Todo>>;
  }

  private constructor ({ configuration }: {
    configuration: IApplicationConfiguration;
  }) {
    this.initialState = { internal: {}};
    this.commands = { internal: {}, external: {}};
    this.events = { internal: {}, external: {}};
    this.views = { internal: {}, external: {}};
    this.flows = { internal: {}};

    for (const [ contextName, contextConfiguration ] of Object.entries(configuration.domain)) {
      const initialState: {
        internal: Dictionary<string, InitialStateConfiguration>;
      } = { internal: {}};
      const commands: {
        internal: Dictionary<string, Dictionary<string, ICommandConfigurationInternal>>;
        external: Dictionary<string, Dictionary<string, ICommandConfigurationExternal>>;
      } = { internal: {}, external: {}};
      const events: {
        internal: Dictionary<string, Dictionary<string, IEventConfigurationInternal>>;
        external: Dictionary<string, Dictionary<string, IEventConfigurationExternal>>;
      } = { internal: {}, external: {}};

      for (const [ aggregateName, aggregateConfiguration ] of Object.entries(contextConfiguration)) {
        if (!aggregateConfiguration) {
          continue;
        }

        initialState.internal[aggregateName] = aggregateConfiguration.initialState;

        for (const [ commandName, commandConfiguration ] of Object.entries(aggregateConfiguration.commands)) {
          if (!commandConfiguration) {
            continue;
          }

          set(commands, `internal.${aggregateName}.${commandName}`, {
            ...commandConfiguration,
            documentation: stripIndent(commandConfiguration.documentation || '').trim()
          });
          set(
            commands, `external.${aggregateName}.${commandName}`,
            pick(commands, [
              `external.${aggregateName}.${commandName}.documentation`,
              `external.${aggregateName}.${commandName}.schema`
            ])
          );
        }

        for (const [ eventName, eventConfiguration ] of Object.entries(aggregateConfiguration.events)) {
          if (!eventConfiguration) {
            continue;
          }

          set(events, `internal.${aggregateName}.${eventName}`, {
            ...eventConfiguration,
            documentation: stripIndent(eventConfiguration.documentation || '').trim()
          });
          set(
            events, `external.${aggregateName}.${eventName}`,
            pick(events, [
              `external.${aggregateName}.${eventName}.documentation`,
              `external.${aggregateName}.${eventName}.schema`
            ])
          );
        }
      }

      this.initialState.internal[contextName] = initialState.internal;
      this.commands.internal[contextName] = commands.internal;
      this.commands.external[contextName] = commands.external;
      this.events.internal[contextName] = events.internal;
      this.events.external[contextName] = events.external;
    }

    for (const [ modelType, modelTypeDefinition ] of Object.entries(configuration.views)) {
      if (!modelTypeDefinition) {
        continue;
      }

      const views: {
        internal: Dictionary<string, Dictionary<string, Todo>>;
        external: Dictionary<string, Dictionary<string, Todo>>;
      } = { internal: {}, external: {}};

      for (const [ modelName, modelDefinition ] of Object.entries(modelTypeDefinition)) {
        if (!modelDefinition) {
          continue;
        }

        views.internal[modelName] = modelDefinition;
        views.external[modelName] = {};
      }

      this.views.internal[modelType] = views.internal;
      this.views.external[modelType] = views.external;
    }

    for (const [ flowName, flowDefinition ] of Object.entries(configuration.flows)) {
      if (!flowDefinition) {
        continue;
      }

      this.flows.internal[flowName] = flowDefinition;
    }
  }

  public static async validate ({ directory }: {
    directory: string;
  }): Promise<void> {
    await validateDirectory({ directory });
  }

  public static async load ({ directory }: {
    directory: string;
  }): Promise<Application> {
    let cachedApplication: Application;

    try {
      cachedApplication = Application.cache.get({ directory });

      return cachedApplication;
    } catch {
      await validateDirectory({ directory });

      const applicationConfigurationWeak = await getApplicationConfiguration({ directory });
      const applicationConfiguration = validateApplicationConfiguration({ applicationConfiguration: applicationConfigurationWeak });
      const applicationConfigurationExtended = extendApplicationConfiguration({ applicationConfiguration });

      const application = new Application({ configuration: applicationConfigurationExtended });

      Application.cache.set({ directory, application });

      return application;
    }
  }
}

export default Application;
