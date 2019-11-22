import fs from 'fs';
import { oneLine } from 'common-tags';
import path from 'path';
import shell from 'shelljs';

const buildImages = async function (): Promise<void> {
  const entries = await fs.promises.readdir(__dirname);

  await Promise.all(entries.map(async (entry: string): Promise<void> => {
    const imageDirectory = path.join(__dirname, entry);
    const stat = await fs.promises.stat(imageDirectory);

    if (!stat.isDirectory()) {
      return;
    }

    const dockerfile = path.join(imageDirectory, 'Dockerfile');
    const context = path.join(__dirname, '..');

    const { code } = shell.exec(oneLine`
      docker build
        -t thenativeweb/${entry}:latest
        -f ${dockerfile}
        ${context}
    `);

    if (code !== 0) {
      throw new Error(`Failed to build ${entry}:latest.`);
    }
  }));
};

export { buildImages };
