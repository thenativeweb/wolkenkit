import { assert } from 'assertthat';
import { isolated } from 'isolated';
import path from 'path';
import shell from 'shelljs';

const rootPath = path.join(__dirname, '..', '..');
const cliPath = path.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');

type Template = 'blank' | 'chat' | 'chat-simplified';
type Language = 'javascript' | 'typescript';

const initializeApplicationAndRunTests = async function ({ template, language }: {
  template: Template;
  language: Language;
}): Promise<void> {
  const appName = 'test-app';
  const appDirectory = path.join(await isolated(), appName);

  const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template ${template} --language ${language} ${appName}`;

  let { code } = shell.exec(initCommand);

  assert.that(code).is.equalTo(0);

  ({ code } = shell.exec('npm install', { cwd: appDirectory }));
  assert.that(code).is.equalTo(0);

  ({ code } = shell.exec('npm run test', { cwd: appDirectory }));
  assert.that(code).is.equalTo(0);
};

suite('init', function (): void {
  this.timeout(300_000);

  const templates: Template[] = [ 'blank', 'chat', 'chat-simplified' ];
  const languages: Language[] = [ 'javascript', 'typescript' ];

  templates.forEach((template): void => {
    languages.forEach((language): void => {
      suite(template, (): void => {
        suite(language, (): void => {
          test('has successfully running tests.', async (): Promise<void> => {
            await initializeApplicationAndRunTests({ template, language });
          });
        });
      });
    });
  });
});
