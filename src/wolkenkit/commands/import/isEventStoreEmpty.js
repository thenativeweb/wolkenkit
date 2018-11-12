'use strict';

const isEventStoreEmpty = async function ({ eventStore }) {
  const replayStream = await eventStore.getReplay({
    fromPosition: 1,
    toPosition: 1
  });

  /* eslint-disable no-unused-vars */
  for await (const event of replayStream) {
    return false;
  }
  /* eslint-enable no-unused-vars */

  return true;
};

module.exports = isEventStoreEmpty;
