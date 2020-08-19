import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import path from 'path';
import { validateViewDefinition } from '../validators/validateViewDefinition';
import { ViewDefinition } from './ViewDefinition';
import { ViewEnhancer } from '../../tools/ViewEnhancer';
import { ViewsDefinition } from './ViewsDefinition';
import { constants, promises as fs } from 'fs';

const getViewsDefinition = async function ({ viewsDirectory }: {
  viewsDirectory: string;
}): Promise<ViewsDefinition> {
  if (!await exists({ path: viewsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/views' not found.`);
  }

  const viewsDefinition: ViewsDefinition = {};

  for (const viewEntry of await fs.readdir(viewsDirectory, { withFileTypes: true })) {
    const viewName = path.basename(viewEntry.name, '.js'),
          viewPath = path.join(viewsDirectory, viewEntry.name);

    // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
    if (viewEntry.isFile() && path.extname(viewEntry.name) !== '.js') {
      continue;
    }
    if (viewEntry.isDirectory()) {
      const indexPath = path.join(viewPath, 'index.js');

      try {
        await fs.access(indexPath, constants.R_OK);
      } catch (ex) {
        throw new errors.FileNotFound(`No view definition in '<app>/build/server/views/${viewName}' found.`);
      }
    }

    let rawView;

    try {
      rawView = (await import(viewPath)).default;
    } catch (ex) {
      if (ex instanceof SyntaxError) {
        throw new errors.ApplicationMalformed(`Syntax error in '<app>/build/server/views/${viewName}'.`, { cause: ex });
      }
      if (ex.code === 'MODULE_NOT_FOUND') {
        throw new errors.ApplicationMalformed(`Missing import in '<app>/build/server/views/${viewName}'.`, { cause: ex });
      }

      throw new errors.FileNotFound(`No view definition in '<app>/build/server/views/${viewName}' found.`);
    }

    try {
      validateViewDefinition({
        viewDefinition: rawView
      });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`View definition '<app>/build/server/views/${viewName}' is malformed: ${ex.message}`);
    }

    const viewEnhancers = (rawView.enhancers || []) as ViewEnhancer[];

    const enhancedViewDefinition = viewEnhancers.reduce(
      (viewDefinition, viewEnhancer): ViewDefinition =>
        viewEnhancer(viewDefinition),
      rawView
    );

    viewsDefinition[viewName] = enhancedViewDefinition;
  }

  return viewsDefinition;
};

export { getViewsDefinition };
