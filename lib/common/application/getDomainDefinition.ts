import { AggregateDefinition } from './AggregateDefinition';
import { AggregateEnhancer } from '../../tools/AggregateEnhancer';
import { DomainDefinition } from './DomainDefinition';
import { exists } from '../utils/fs/exists';
import fs from 'fs';
import { isErrnoException } from '../utils/isErrnoException';
import { parseAggregate } from '../parsers/parseAggregate';
import path from 'path';
import * as errors from '../errors';

const getDomainDefinition = async function ({ domainDirectory }: {
  domainDirectory: string;
}): Promise<DomainDefinition> {
  if (!await exists({ path: domainDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/domain' not found.`);
  }

  const domainDefinition: DomainDefinition = {};

  for (const contextDirectory of await fs.promises.readdir(domainDirectory, { withFileTypes: true })) {
    if (!contextDirectory.isDirectory()) {
      continue;
    }

    const contextPath = path.join(domainDirectory, contextDirectory.name);
    const contextName = contextDirectory.name;

    domainDefinition[contextName] = {};

    for (const aggregateEntry of await fs.promises.readdir(contextPath, { withFileTypes: true })) {
      const aggregateName = path.basename(aggregateEntry.name, '.js'),
            aggregatePath = path.join(contextPath, aggregateEntry.name);

      // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
      if (aggregateEntry.isFile() && path.extname(aggregateEntry.name) !== '.js') {
        continue;
      }
      if (aggregateEntry.isDirectory()) {
        const indexPath = path.join(aggregatePath, 'index.js');

        try {
          await fs.promises.access(indexPath, fs.constants.R_OK);
        } catch {
          throw new errors.FileNotFound(`No aggregate definition in '<app>/build/server/domain/${contextName}/${aggregateName}' found.`);
        }
      }

      let rawAggregate;

      try {
        rawAggregate = (await import(aggregatePath)).default;
      } catch (ex: unknown) {
        if (ex instanceof SyntaxError) {
          throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/domain/${contextName}/${aggregateName}'.`, cause: ex });
        }
        if (isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
          throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/domain/${contextName}/${aggregateName}'.`, cause: ex as Error });
        }

        throw new errors.FileNotFound(`No aggregate definition in '<app>/build/server/domain/${contextName}/${aggregateName}' found.`);
      }

      const aggregate = parseAggregate({
        aggregate: rawAggregate
      }).unwrapOrThrow(
        (err): Error => new errors.AggregateDefinitionMalformed(`Aggregate definition '<app>/build/server/domain/${contextName}/${aggregateName}' is malformed: ${err.message}`)
      );

      const aggregateEnhancers = (rawAggregate.enhancers || []) as AggregateEnhancer[];

      const enhancedAggregateDefinition: AggregateDefinition = aggregateEnhancers.reduce(
        (aggregateDefinition, aggregateEnhancer): AggregateDefinition =>
          aggregateEnhancer(aggregateDefinition),
        aggregate
      );

      domainDefinition[contextName][aggregateName] = enhancedAggregateDefinition;
    }
  }

  return domainDefinition;
};

export { getDomainDefinition };
