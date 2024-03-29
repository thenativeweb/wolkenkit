import { AskInfrastructure } from '../elements/AskInfrastructure';
import { exists } from '../utils/fs/exists';
import fs from 'fs';
import { isErrnoException } from '../utils/isErrnoException';
import { parseView } from '../parsers/parseView';
import path from 'path';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { View } from '../elements/View';
import { ViewEnhancer } from '../../tools/ViewEnhancer';
import { ViewsDefinition } from './ViewsDefinition';
import * as errors from '../errors';

const getViewsDefinition = async function ({ viewsDirectory }: {
  viewsDirectory: string;
}): Promise<ViewsDefinition> {
  if (!await exists({ path: viewsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/views' not found.`);
  }

  const viewsDefinition: ViewsDefinition = {};

  for (const viewEntry of await fs.promises.readdir(viewsDirectory, { withFileTypes: true })) {
    const viewName = path.basename(viewEntry.name, '.js'),
          viewPath = path.join(viewsDirectory, viewEntry.name);

    // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
    if (viewEntry.isFile() && path.extname(viewEntry.name) !== '.js') {
      continue;
    }
    if (viewEntry.isDirectory()) {
      const indexPath = path.join(viewPath, 'index.js');

      try {
        await fs.promises.access(indexPath, fs.constants.R_OK);
      } catch {
        throw new errors.FileNotFound(`No view definition in '<app>/build/server/views/${viewName}' found.`);
      }
    }

    let rawView;

    try {
      rawView = (await import(viewPath)).default;
    } catch (ex: unknown) {
      if (ex instanceof SyntaxError) {
        throw new errors.ApplicationMalformed({ message: `Syntax error in '<app>/build/server/views/${viewName}'.`, cause: ex });
      }
      if (isErrnoException(ex) && ex.code === 'MODULE_NOT_FOUND') {
        throw new errors.ApplicationMalformed({ message: `Missing import in '<app>/build/server/views/${viewName}'.`, cause: ex as Error });
      }

      throw new errors.FileNotFound(`No view definition in '<app>/build/server/views/${viewName}' found.`);
    }

    parseView({
      viewDefinition: rawView
    }).unwrapOrThrow(
      (err): Error => new errors.ViewDefinitionMalformed(`View definition '<app>/build/server/views/${viewName}' is malformed: ${err.message}`)
    );

    const viewEnhancers = (rawView.enhancers || []) as ViewEnhancer[];

    const enhancedViewDefinition = viewEnhancers.reduce(
      (viewDefinition, viewEnhancer): View<AskInfrastructure & TellInfrastructure> =>
        viewEnhancer(viewDefinition),
      rawView
    );

    viewsDefinition[viewName] = enhancedViewDefinition;
  }

  return viewsDefinition;
};

export { getViewsDefinition };
