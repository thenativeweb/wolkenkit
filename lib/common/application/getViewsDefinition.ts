import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import { validateViewDefinition } from '../validators/validateViewDefinition';
import { ViewDefinition } from './ViewDefinition';
import { ViewEnhancer } from '../../tools/ViewEnhancer';
import { ViewsDefinition } from './ViewsDefinition';

const getViewsDefinition = async function ({ viewsDirectory }: {
  viewsDirectory: string;
}): Promise<ViewsDefinition> {
  if (!await exists({ path: viewsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/views' not found.`);
  }

  const viewsDefinition: ViewsDefinition = {};

  for (const viewEntry of await fs.readdir(viewsDirectory, { withFileTypes: true })) {
    const viewName = path.basename(viewEntry.name, '.js'),
          viewPath = path.join(viewsDirectory, viewEntry.name);

    let rawView;

    try {
      rawView = (await import(viewPath)).default;
    } catch {
      // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
      if (viewEntry.isFile()) {
        continue;
      }

      // But throw an error if the entry is a directory without importable content.
      throw new errors.FileNotFound(`No view definition in '<app>/build/views/${viewName}' found.`);
    }

    try {
      validateViewDefinition({
        viewDefinition: rawView
      });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`View definition '<app>/build/views/${viewName}' is malformed: ${ex.message}`);
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
