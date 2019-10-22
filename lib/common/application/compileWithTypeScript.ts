import getFiles from '../utils/fs/getFiles';
import path from 'path';
import { CompilerOptions, createProgram } from 'typescript';

const compileWithTypeScript = async function ({
  sourceDirectory,
  targetDirectory,
  compilerOptions
}: {
  sourceDirectory: string;
  targetDirectory: string;
  compilerOptions: CompilerOptions;
}): Promise<void> {
  const sourceFiles = await getFiles({
    directory: sourceDirectory,
    predicate: (entry): boolean => path.extname(entry.name) === '.ts'
  });

  const program = createProgram(sourceFiles, {
    ...compilerOptions,
    outDir: targetDirectory
  });
  const emitResult = program.emit();

  if (emitResult.emitSkipped) {
    throw new Error('Compilation failed.');
  }
};

export default compileWithTypeScript;


(async () => {
  await compileWithTypeScript({
    sourceDirectory: __dirname,
    targetDirectory: '/Users/golo/Projekte/thenativeweb/wolkenkit/foo',
    require('../../../../tsconfig.json').compilerOptions
  });
})();
