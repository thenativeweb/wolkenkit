const sleep = async function ({ ms }: { ms: number }): Promise<void> {
  await new Promise<void>((resolve): void => {
    setTimeout(resolve, ms);
  });
};

export { sleep };
