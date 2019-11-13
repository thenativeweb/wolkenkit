import path from 'path';

const getTestApplicationDirectory = function ({ name, language = 'javascript' }: {
  name: string;
  language?: 'javascript' | 'typescript';
}): string {
  return path.join(__dirname, language, name);
};

export {
  getTestApplicationDirectory
};
