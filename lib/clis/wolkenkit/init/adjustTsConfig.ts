import fs from 'fs';

const adjustTsConfig = async function ({ tsconfig }: {
  tsconfig: string;
}): Promise<void> {
  const content = JSON.parse(await fs.promises.readFile(tsconfig, 'utf8'));

  Reflect.deleteProperty(content.compilerOptions, 'baseUrl');
  Reflect.deleteProperty(content.compilerOptions, 'paths');

  await fs.promises.writeFile(tsconfig, JSON.stringify(content, null, 2), 'utf8');
};

export { adjustTsConfig };
