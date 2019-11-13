const sleep = async function ({ ms }: { ms: number }): Promise<void> {
  await new Promise((resolve): void => {
    setTimeout(resolve, ms);
  });
};

export { sleep };
