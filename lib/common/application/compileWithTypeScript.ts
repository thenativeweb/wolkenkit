import CompilerErrorData from './CompilerErrorData';
import errors from '../errors';
import getFiles from '../utils/fs/getFiles';
import path from 'path';
import {
  CompilerOptions,
  createProgram,
  flattenDiagnosticMessageText,
  getPreEmitDiagnostics,
  ModuleKind
} from 'typescript';

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
    module: ModuleKind.CommonJS,
    noEmitOnError: true,
    outDir: targetDirectory
  });

  const emitResult = program.emit();
  const diagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  const compilerErrors = [];

  for (const diagnostic of diagnostics) {
    if (!diagnostic.file) {
      const compilerErrorData = new CompilerErrorData({
        message: flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      });

      compilerErrors.push(compilerErrorData);
      continue;
    }

    const {
      line,
      character
    } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);

    const compilerErrorData = new CompilerErrorData({
      message: flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      line,
      column: character,
      fileName: diagnostic.file.fileName
    });

    compilerErrors.push(compilerErrorData);
  }

  if (emitResult.emitSkipped) {
    throw new errors.CompilationFailed('Compilation failed.', { data: compilerErrors });
  }
};

export default compileWithTypeScript;
