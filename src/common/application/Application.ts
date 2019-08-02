import ApplicationCache from './ApplicationCache';
import commonTags from 'common-tags';
import extendEntries from './extendEntries';
import getApplicationConfiguration from './getApplicationConfiguration';
import validateApplicationConfiguration from './validateApplicationConfiguration';
import validateDirectory from './validateDirectory';

const { stripIndent } = commonTags;

class Application {
  private static cache = new ApplicationCache();

  private constructor ({ entries }) {
    if (!entries) {
      throw new Error('Entries are missing.');
    }

    this.initialState = { internal: {}};
    this.commands = { internal: {}, external: {}};
    this.events = { internal: {}, external: {}};
    this.views = { internal: {}, external: {}};
    this.flows = { internal: {}};

    for (const [ contextName, contextDefinition ] of Object.entries(entries.server.domain)) {
      this.initialState.internal[contextName] = {};
      this.commands.internal[contextName] = {};
      this.events.internal[contextName] = {};

      this.commands.external[contextName] = {};
      this.events.external[contextName] = {};

      for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
        this.initialState.internal[contextName][aggregateName] = aggregateDefinition.initialState;
        this.commands.internal[contextName][aggregateName] = aggregateDefinition.commands;
        this.events.internal[contextName][aggregateName] = aggregateDefinition.events;

        this.commands.external[contextName][aggregateName] = {};
        this.events.external[contextName][aggregateName] = {};

        for (const [ commandName, commandDefinition ] of Object.entries(aggregateDefinition.commands)) {
          let documentation;

          if (commandDefinition.documentation) {
            documentation = stripIndent(commandDefinition.documentation).trim();
          }

          const { schema } = commandDefinition;

          this.commands.internal[contextName][aggregateName][commandName].documentation = documentation;
          this.commands.external[contextName][aggregateName][commandName] = { documentation, schema };
        }

        for (const [ eventName, eventDefinition ] of Object.entries(aggregateDefinition.events)) {
          let documentation;

          if (eventDefinition.documentation) {
            documentation = stripIndent(eventDefinition.documentation).trim();
          }

          const { schema } = eventDefinition;

          this.events.internal[contextName][aggregateName][eventName].documentation = documentation;
          this.events.external[contextName][aggregateName][eventName] = { documentation, schema };
        }
      }
    }

    for (const [ modelType, modelTypeDefinition ] of Object.entries(entries.server.views)) {
      this.views.internal[modelType] = {};
      this.views.external[modelType] = {};

      for (const [ modelName, modelDefinition ] of Object.entries(modelTypeDefinition)) {
        this.views.internal[modelType][modelName] = modelDefinition;
        this.views.external[modelType][modelName] = {};
      }
    }

    for (const [ flowName, flowDefinition ] of Object.entries(entries.server.flows)) {
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

      const applicationConfiguration =
        await getApplicationConfiguration({ directory });
      const validatedApplicationConfiguration =
        validateApplicationConfiguration({ applicationConfiguration });
      const extendedEntries =
        extendEntries({ entries: validatedApplicationConfiguration });

      const application = new Application({ entries: extendedEntries });

      Application.cache.set({ directory, application });

      return application;
    }
  }
}

export default Application;
