import { AskInfrastructure } from '../elements/AskInfrastructure';
import { exists } from '../utils/fs/exists';
import { Hooks } from '../elements/Hooks';
import { isErrnoException } from '../utils/isErrnoException';
import { parseHooks } from '../parsers/parseHooks';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import * as errors from '../errors';

const getHooksDefinition = async function ({ hooksDirectory }: {
  hooksDirectory: string;
}): Promise<Hooks<AskInfrastructure & TellInfrastructure>> {
  if (!await exists({ path: hooksDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/hooks' not found.`);
  }

  let hooksDefinition: Hooks<AskInfrastructure & TellInfrastructure>;

  try {
    hooksDefinition = (await import(hooksDirectory)).default;
  } catch (ex: unknown) {
    if (ex instanceof SyntaxError) {
      throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/hooks'.`, cause: ex });
    }
    if (isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
      throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/hooks'.`, cause: ex as Error });
    }

    // But throw an error if the entry is a directory without importable content.
    throw new errors.FileNotFound(`No hooks definition in '<app>/build/server/hooks' found.`);
  }

  return parseHooks({ hooksDefinition }).unwrapOrThrow(
    (err): Error => new errors.HooksDefinitionMalformed(`Hooks definition '<app>/build/server/hooks' is malformed: ${err.message}`)
  );
};

export { getHooksDefinition };
