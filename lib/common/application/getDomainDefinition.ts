import { AggregateDefinition } from './AggregateDefinition';
import { AggregateEnhancer } from '../../tools/AggregateEnhancer';
import { DomainDefinition } from './DomainDefinition';
import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import { validateAggregateDefinition } from '../validators/validateAggregateDefinition';

const getDomainDefinition = async function ({ domainDirectory }: {
  domainDirectory: string;
}): Promise<DomainDefinition> {
  if (!await exists({ path: domainDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/domain' not found.`);
  }

  const domainDefinition: DomainDefinition = {};

  for (const contextDirectory of await fs.readdir(domainDirectory, { withFileTypes: true })) {
    if (!contextDirectory.isDirectory()) {
      continue;
    }

    const contextPath = path.join(domainDirectory, contextDirectory.name);
    const contextName = contextDirectory.name;

    domainDefinition[contextName] = {};

    for (const aggregateEntry of await fs.readdir(contextPath, { withFileTypes: true })) {
      const aggregateName = path.basename(aggregateEntry.name, '.js'),
            aggregatePath = path.join(contextPath, aggregateEntry.name);

      // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
      if (aggregateEntry.isFile() && path.extname(aggregateEntry.name) !== '.js') {
        continue;
      }

      let rawAggregate;

      try {
        rawAggregate = (await import(aggregatePath)).default;
      } catch (ex) {
        if (ex instanceof SyntaxError) {
          throw new errors.ApplicationMalformed(`Syntax error in '<app>/build/server/domain/${contextName}/${aggregateName}'.`, { cause: ex });
        }

        throw new errors.FileNotFound(`No aggregate definition in '<app>/build/server/domain/${contextName}/${aggregateName}' found.`);
      }

      try {
        validateAggregateDefinition({
          aggregateDefinition: rawAggregate
        });
      } catch (ex) {
        throw new errors.AggregateDefinitionMalformed(`Aggregate definition '<app>/build/server/domain/${contextName}/${aggregateName}' is malformed: ${ex.message}`);
      }

      const aggregateEnhancers = (rawAggregate.enhancers || []) as AggregateEnhancer[];

      const enhancedAggregateDefinition = aggregateEnhancers.reduce(
        (aggregateDefinition, aggregateEnhancer): AggregateDefinition =>
          aggregateEnhancer(aggregateDefinition),
        rawAggregate
      );

      domainDefinition[contextName][aggregateName] = enhancedAggregateDefinition;
    }
  }

  return domainDefinition;
};

export { getDomainDefinition };
