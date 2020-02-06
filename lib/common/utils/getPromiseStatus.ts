const getPromiseStatus = async function (promise: Promise<any>): Promise<'resolved' | 'pending' | 'rejected'> {
  const value = {};

  try {
    const result = await Promise.race([ promise, value ]);

    if (result === value) {
      return 'pending';
    }

    return 'resolved';
  } catch (ex) {
    return 'rejected';
  }
};

export { getPromiseStatus };
