import { CommandData } from '../elements/CommandData';
import { CommandHandler } from '../elements/CommandHandler';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import errors from '../errors';
import exists from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import { Schema } from '../elements/Schema';
import { State } from '../elements/State';
import validateAggregateDefinition from '../validators/validateAggregateDefinition';

const getDomainEventDefinitions = async function ({ domainDirectory }: {
  domainDirectory: string;
}): Promise<Record<string, Record<string, Record<string, DomainEventHandler<State, DomainEventData>>>>> {
  if (!await exists({ path: domainDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server/domain' not found.`);
  }

  const domainEventDefinitions: Record<string, Record<string, Record<string, DomainEventHandler<State, DomainEventData>>>> = {};

  for (const contextDirectory of await fs.readdir(domainDirectory, { withFileTypes: true })) {
    if (!contextDirectory.isDirectory()) {
      continue;
    }

    const contextPath = path.join(domainDirectory, contextDirectory.name);
    const contextName = contextDirectory.name;

    domainEventDefinitions[contextName] = {};

    for (const aggregateEntry of await fs.readdir(contextPath, { withFileTypes: true })) {
      let aggregateName,
          aggregatePath;

      if (aggregateEntry.isFile() && path.extname(aggregateEntry.name) === '.js') {
        aggregateName = path.basename(aggregateEntry.name, '.js');
        aggregatePath = path.join(contextPath, aggregateEntry.name);
      } else if (aggregateEntry.isDirectory()) {
        aggregateName = aggregateEntry.name;
        aggregatePath = path.join(contextPath, aggregateEntry.name, 'index.js');

        if (!await exists({ path: aggregatePath })) {
          throw new errors.FileNotFound(`File '<app>/server/domain/${contextName}/${aggregateName}/index.js' not found.`);
        }
      } else {
        continue;
      }

      const importedAggregateDefinition = await import(aggregatePath);

      try {
        validateAggregateDefinition({
          aggregateDefinition: importedAggregateDefinition
        });
      } catch (ex) {
        throw new errors.AggregateDefinitionMalformed(`Aggregate definition '<app>/server/domain/${contextName}/${aggregateName}' is malformed: ${ex.message}`);
      }

      const aggregateDefinition = importedAggregateDefinition as {
        commands: Record<string, CommandHandler<State, CommandData>>;
        domainEvents: Record<string, DomainEventHandler<State, DomainEventData>>;
      };

      domainEventDefinitions[contextName][aggregateName] = {};

      for (const [ domainEventName, domainEventHandler ] of Object.entries(aggregateDefinition.domainEvents)) {
        domainEventDefinitions[contextName][aggregateName][domainEventName] = domainEventHandler;
      }

      for (const commandName of Object.keys(aggregateDefinition.commands)) {
        const domainEventNameFailed = `${commandName}Failed`;
        const domainEventNameRejected = `${commandName}Rejected`;

        if (domainEventNameFailed in domainEventDefinitions[contextName][aggregateName]) {
          throw new errors.DomainEventDefinitionInvalid(`Reserved event name '${domainEventNameFailed}' used in '<app>/server/domain/${contextName}/${aggregateName}'.`);
        }

        if (domainEventNameRejected in domainEventDefinitions[contextName][aggregateName]) {
          throw new errors.DomainEventDefinitionInvalid(`Reserved event name '${domainEventNameRejected}' used in '<app>/server/domain/${contextName}/${aggregateName}'.`);
        }

        const domainEventDefinition: DomainEventHandler<State, any> = {
          getSchema (): Schema {
            return {
              type: 'object',
              properties: {
                reason: { type: 'string' }
              },
              required: [ 'reason' ],
              additionalProperties: false
            };
          },

          handle (state): Partial<State> {
            return state;
          },

          isAuthorized (_state, domainEvent, { client }): boolean {
            return domainEvent.metadata.initiator.user.id === client.user.id;
          }
        };

        domainEventDefinitions[contextName][aggregateName][domainEventNameFailed] = domainEventDefinition;
        domainEventDefinitions[contextName][aggregateName][domainEventNameRejected] = domainEventDefinition;
      }
    }
  }

  return domainEventDefinitions;
};

export default getDomainEventDefinitions;
