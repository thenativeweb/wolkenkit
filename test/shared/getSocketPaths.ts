import temp from 'temp';

const getSocketPaths = async function ({ count }: {
  count: number;
}): Promise<string[]> {
  const socketPaths = [];

  for (let i = 0; i < count; i++) {
    socketPaths.push(temp.path({ suffix: '.socket' }));
  }

  return socketPaths;
};

export { getSocketPaths };
