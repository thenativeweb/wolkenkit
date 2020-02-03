const isPromiseResolved = async function (promise: Promise<any>): Promise<boolean> {
  const foo = {};

  try {
    const result = await Promise.race([ promise, foo ]);

    return result !== foo;
  } catch (ex) {
    return false;
  }
};

export {
  isPromiseResolved
};
