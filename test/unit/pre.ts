import path from 'path';
import shell from 'shelljs';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  shell.exec('npx roboter build', { cwd: path.join(__dirname, '..', '..') });
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
