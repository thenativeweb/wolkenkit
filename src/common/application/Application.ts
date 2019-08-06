import ApplicationCache from './ApplicationCache';
import { ApplicationConfiguration } from './ApplicationConfiguration';
import { CommandConfigurationExternal } from './CommandConfigurationExternal';
import { CommandConfigurationInternal } from './CommandConfigurationInternal';
import { Dictionary } from '../../types/Dictionary';
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
import { pick, set } from 'lodash';

class Application {
  private static cache = new ApplicationCache();

  public readonly initialState: {
    internal: Dictionary<Dictionary<InitialStateConfiguration>>;
  }

  public readonly commands: {
    internal: Dictionary<Dictionary<Dictionary<CommandConfigurationInternal>>>;
    external: Dictionary<Dictionary<Dictionary<CommandConfigurationExternal>>>;
  }

  public readonly events: {
    internal: Dictionary<Dictionary<Dictionary<EventConfigurationInternal>>>;
    external: Dictionary<Dictionary<Dictionary<EventConfigurationExternal>>>;
  }

  public readonly views: {
    internal: Dictionary<Dictionary<Dictionary<Todo>>>;
    external: Dictionary<Dictionary<Dictionary<Todo>>>;
  }

  public readonly flows: {
    internal: Dictionary<Dictionary<Todo>>;
  }

  private constructor ({ configuration }: {
    configuration: ApplicationConfiguration;
  }) {
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
        internal: Dictionary<InitialStateConfiguration>;
      } = { internal: {}};
      const commands: {
        internal: Dictionary<Dictionary<CommandConfigurationInternal>>;
        external: Dictionary<Dictionary<CommandConfigurationExternal>>;
      } = { internal: {}, external: {}};
      const events: {
        internal: Dictionary<Dictionary<EventConfigurationInternal>>;
        external: Dictionary<Dictionary<EventConfigurationExternal>>;
      } = { internal: {}, external: {}};

      for (const [ aggregateName, aggregateConfiguration ] of Object.entries(contextConfiguration)) {
        if (!aggregateConfiguration) {
          throw new errors.InvalidOperation();
        }

        initialState.internal[aggregateName] = aggregateConfiguration.initialState;

        for (const [ commandName, commandConfiguration ] of Object.entries(aggregateConfiguration.commands)) {
          if (!commandConfiguration) {
            throw new errors.InvalidOperation();
          }

          set(commands, `internal.${aggregateName}.${commandName}`, {
            ...commandConfiguration,
            documentation: stripIndent(commandConfiguration.documentation || '').trim()
          });
          set(
            commands, `external.${aggregateName}.${commandName}`,
            pick(commands, [
              `internal.${aggregateName}.${commandName}.documentation`,
              `internal.${aggregateName}.${commandName}.schema`
            ])
          );
        }

        for (const [ eventName, eventConfiguration ] of Object.entries(aggregateConfiguration.events)) {
          if (!eventConfiguration) {
            throw new errors.InvalidOperation();
          }

          set(events, `internal.${aggregateName}.${eventName}`, {
            ...eventConfiguration,
            documentation: stripIndent(eventConfiguration.documentation || '').trim()
          });
          set(
            events, `external.${aggregateName}.${eventName}`,
            pick(events, [
              `internal.${aggregateName}.${eventName}.documentation`,
              `internal.${aggregateName}.${eventName}.schema`
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
        throw new errors.InvalidOperation();
      }

      const views: {
        internal: Dictionary<Dictionary<Todo>>;
        external: Dictionary<Dictionary<Todo>>;
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
