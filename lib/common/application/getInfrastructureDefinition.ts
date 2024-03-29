import { AskInfrastructure } from '../elements/AskInfrastructure';
import { exists } from '../utils/fs/exists';
import { InfrastructureDefinition } from './InfrastructureDefinition';
import { isErrnoException } from '../utils/isErrnoException';
import { parseInfrastructureDefinition } from '../parsers/parseInfrastructureDefinition';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import * as errors from '../errors';

const getInfrastructureDefinition = async function ({ infrastructureDirectory }: {
  infrastructureDirectory: string;
}): Promise<InfrastructureDefinition<AskInfrastructure, TellInfrastructure>> {
  if (!await exists({ path: infrastructureDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/infrastructure' not found.`);
  }

  let infrastructureDefinition: InfrastructureDefinition<AskInfrastructure, TellInfrastructure>;

  try {
    infrastructureDefinition = (await import(infrastructureDirectory)).default;
  } catch (ex: unknown) {
    if (ex instanceof SyntaxError) {
      throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/infrastructure'.`, cause: ex });
    }
    if (isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
      throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/infrastructure'.`, cause: ex as Error });
    }

    // But throw an error if the entry is a directory without importable content.
    throw new errors.FileNotFound(`No infrastructure definition in '<app>/build/server/infrastructure' found.`);
  }

  return parseInfrastructureDefinition({ infrastructureDefinition }).unwrapOrThrow(
    (err): Error => new errors.InfrastructureDefinitionMalformed(`Infrastructure definition '<app>/build/server/infrastructure' is malformed: ${err.message}`)
  );
};

export { getInfrastructureDefinition };
