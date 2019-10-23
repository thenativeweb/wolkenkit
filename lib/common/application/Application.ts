import ApplicationCache from './ApplicationCache';
import { ApplicationConfiguration } from './ApplicationConfiguration';
import { CommandConfigurationExternal } from './CommandConfigurationExternal';
import { CommandConfigurationInternal } from './CommandConfigurationInternal';
import errors from '../errors';
import { EventConfigurationExternal } from './EventConfigurationExternal';
import { EventConfigurationInternal } from './EventConfigurationInternal';
import extendApplicationConfiguration from './extendApplicationConfiguration';
import getApplicationConfiguration from './getApplicationConfiguration';
import { InitialStateConfiguration } from './InitialStateConfiguration';
import { stripIndent } from 'common-tags';
import { Todo } from '../../types/Todo';
import validateApplicationConfiguration from './validateApplicationConfiguration';
import validateDirectory from './validateDirectory';
import { get, set } from 'lodash';

class Application {
  private static readonly cache = new ApplicationCache();

  public readonly rootDirectory: string;

  public readonly initialState: {
    internal: Record<string, Record<string, InitialStateConfiguration>>;
  };

  public readonly commands: {
    internal: Record<string, Record<string, Record<string, CommandConfigurationInternal>>>;
    external: Record<string, Record<string, Record<string, CommandConfigurationExternal>>>;
  };

  public readonly events: {
    internal: Record<string, Record<string, Record<string, EventConfigurationInternal>>>;
    external: Record<string, Record<string, Record<string, EventConfigurationExternal>>>;
  };

  public readonly views: {
    internal: Record<string, Record<string, Record<string, Todo>>>;
    external: Record<string, Record<string, Record<string, Todo>>>;
  };

  public readonly flows: {
    internal: Record<string, Record<string, Todo>>;
  };

  private constructor ({ configuration }: {
    configuration: ApplicationConfiguration;
  }) {
    this.rootDirectory = configuration.rootDirectory;
    this.initialState = { internal: {}};
    this.commands = { internal: {}, external: {}};
    this.events = { internal: {}, external: {}};
    this.views = { internal: {}, external: {}};
    this.flows = { internal: {}};

    for (const [ contextName, contextConfiguration ] of Object.entries(configuration.domain)) {
      if (!contextConfiguration) {
        throw new errors.InvalidOperation();
      }

      const initialState: {
        internal: Record<string, InitialStateConfiguration>;
      } = { internal: {}};
      const commands: {
        internal: Record<string, Record<string, CommandConfigurationInternal>>;
        external: Record<string, Record<string, CommandConfigurationExternal>>;
      } = { internal: {}, external: {}};
      const events: {
        internal: Record<string, Record<string, EventConfigurationInternal>>;
        external: Record<string, Record<string, EventConfigurationExternal>>;
      } = { internal: {}, external: {}};

      for (const [ aggregateName, aggregateConfiguration ] of Object.entries(contextConfiguration)) {
        if (!aggregateConfiguration) {
          throw new errors.InvalidOperation();
        }

        initialState.internal[aggregateName] = aggregateConfiguration.initialState;

        for (const [ commandName, commandConfiguration ] of Object.entries(aggregateConfiguration.commands)) {
          set(commands, `internal.${aggregateName}.${commandName}`, {
            ...commandConfiguration,
            documentation: commandConfiguration.documentation ? stripIndent(commandConfiguration.documentation).trim() : undefined
          });
          set(
            commands, `external.${aggregateName}.${commandName}`, {
              documentation: get(commands, `internal.${aggregateName}.${commandName}.documentation`),
              schema: get(commands, `internal.${aggregateName}.${commandName}.schema`)
            }
          );
        }

        for (const [ eventName, eventConfiguration ] of Object.entries(aggregateConfiguration.events)) {
          set(events, `internal.${aggregateName}.${eventName}`, {
            ...eventConfiguration,
            documentation: eventConfiguration.documentation ? stripIndent(eventConfiguration.documentation).trim() : undefined
          });
          set(
            events, `external.${aggregateName}.${eventName}`, {
              documentation: get(events, `internal.${aggregateName}.${eventName}.documentation`),
              schema: get(events, `internal.${aggregateName}.${eventName}.schema`)
            }
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
        throw new errors.InvalidOperation();
      }

      const views: {
        internal: Record<string, Record<string, Todo>>;
        external: Record<string, Record<string, Todo>>;
      } = { internal: {}, external: {}};

      for (const [ modelName, modelDefinition ] of Object.entries(modelTypeDefinition)) {
        if (!modelDefinition) {
          throw new errors.InvalidOperation();
        }

        views.internal[modelName] = modelDefinition;
        views.external[modelName] = {};
      }

      this.views.internal[modelType] = views.internal;
      this.views.external[modelType] = views.external;
    }

    for (const [ flowName, flowDefinition ] of Object.entries(configuration.flows)) {
      if (!flowDefinition) {
        throw new errors.InvalidOperation();
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
