import path from 'path';
import shell from 'shelljs';

const transform = async ({ applicationDirectory }: { applicationDirectory: string }): Promise<void> => {
  shell.rm('-rf', path.join(applicationDirectory, 'server', 'domain'));
  shell.rm('-rf', path.join(applicationDirectory, 'server', 'views', 'sampleView', 'projections'));
  shell.rm('-rf', path.join(applicationDirectory, 'server', 'views', 'sampleView', 'queries'));
  shell.rm('-rf', path.join(applicationDirectory, 'server', 'views', 'sampleView', 'initializer.ts'));
};

export {
  transform
};
