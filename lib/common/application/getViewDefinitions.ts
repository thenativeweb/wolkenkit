import errors from '../errors';
import exists from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import validateViewDefinition from '../validators/validateViewDefinition';
import { ViewDefinition } from './ViewDefinition';

const getViewDefinitions = async function ({ viewsDirectory }: {
  viewsDirectory: string;
}): Promise<Record<string, ViewDefinition>> {
  if (!await exists({ path: viewsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server/views' not found.`);
  }

  const viewDefinitions: Record<string, ViewDefinition> = {};

  for (const viewEntry of await fs.readdir(viewsDirectory, { withFileTypes: true })) {
    let viewName,
        viewPath;

    if (viewEntry.isFile() && path.extname(viewEntry.name) === '.js') {
      viewName = path.basename(viewEntry.name, '.js');
      viewPath = path.join(viewsDirectory, viewEntry.name);
    } else if (viewEntry.isDirectory()) {
      viewName = viewEntry.name;
      viewPath = path.join(viewsDirectory, viewEntry.name, 'index.js');

      if (!await exists({ path: viewPath })) {
        throw new errors.FileNotFound(`File '<app>/server/views/${viewName}/index.js' not found.`);
      }
    } else {
      continue;
    }

    const importedViewDefinition = await import(viewPath);

    try {
      validateViewDefinition({
        viewDefinition: importedViewDefinition
      });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`View definition '<app>/server/views/${viewName}' is malformed: ${ex.message}`);
    }

    const viewDefinition = importedViewDefinition as ViewDefinition;

    viewDefinitions[viewName] = viewDefinition;
  }

  return viewDefinitions;
};

export default getViewDefinitions;
