import { AggregateDefinition } from '../elements/AggregateDefinition';
import errors from '../errors';
import exists from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import { stripIndent } from 'common-tags';
import validateAggregateDefinition from '../validators/validateAggregateDefinition';
import { DomainEventDescription, DomainEventsDomainDescription } from '../elements/Descriptions';

const getDomainEventsDescription = async function ({ domainDirectory }: {
  domainDirectory: string;
}): Promise<DomainEventsDomainDescription> {
  if (!await exists({ path: domainDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server/domain' not found.`);
  }

  const domainEventsDescription: DomainEventsDomainDescription = {
    domain: {
      contexts: {}
    }
  };

  for (const contextDirectory of await fs.readdir(domainDirectory, { withFileTypes: true })) {
    if (!contextDirectory.isDirectory()) {
      continue;
    }

    const contextPath = path.join(domainDirectory, contextDirectory.name);
    const contextName = contextDirectory.name;

    domainEventsDescription.domain.contexts[contextName] = {
      aggregates: {}
    };

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

      const aggregateDefinition = importedAggregateDefinition as AggregateDefinition;

      domainEventsDescription.
        domain.
        contexts[contextName].
        aggregates[aggregateName] = {
          domainEvents: {}
        };

      for (const [ domainEventName, domainEventHandler ] of Object.entries(aggregateDefinition.domainEvents)) {
        const documentation = domainEventHandler.getDocumentation ?
          stripIndent(domainEventHandler.getDocumentation().trim()) :
          undefined;

        const schema = domainEventHandler.getSchema ?
          domainEventHandler.getSchema() :
          undefined;

        domainEventsDescription.
          domain.
          contexts[contextName].
          aggregates[aggregateName].
          domainEvents[domainEventName] = {
            documentation,
            schema
          };
      }

      for (const commandName of Object.keys(aggregateDefinition.commands)) {
        const domainEventNameFailed = `${commandName}Failed`;
        const domainEventNameRejected = `${commandName}Rejected`;

        if (
          domainEventNameFailed in domainEventsDescription.
            domain.
            contexts[contextName].
            aggregates[aggregateName].
            domainEvents
        ) {
          throw new errors.DomainEventDefinitionInvalid(`Reserved event name '${domainEventNameFailed}' used in '<app>/server/domain/${contextName}/${aggregateName}'.`);
        }

        if (
          domainEventNameRejected in domainEventsDescription.
            domain.
            contexts[contextName].
            aggregates[aggregateName].
            domainEvents
        ) {
          throw new errors.DomainEventDefinitionInvalid(`Reserved event name '${domainEventNameRejected}' used in '<app>/server/domain/${contextName}/${aggregateName}'.`);
        }

        const domainEventDefinition: DomainEventDescription = {
          schema: {
            type: 'object',
            properties: {
              reason: { type: 'string' }
            },
            required: [ 'reason' ],
            additionalProperties: false
          }
        };

        domainEventsDescription.
          domain.
          contexts[contextName].
          aggregates[aggregateName].
          domainEvents[domainEventNameFailed] = domainEventDefinition;

        domainEventsDescription.
          domain.
          contexts[contextName].
          aggregates[aggregateName].
          domainEvents[domainEventNameRejected] = domainEventDefinition;
      }
    }
  }

  return domainEventsDescription;
};

export default getDomainEventsDescription;
