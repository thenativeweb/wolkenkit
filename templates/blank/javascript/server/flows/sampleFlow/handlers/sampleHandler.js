'use strict';

const sampleHandler = {
  isRelevant () {
    return true;
  },

  async handle (_domainEvent, { notification }) {
    // ...

    await notification.publish('flowSampleFlowUpdated', {});
  }
};

module.exports = { sampleHandler };
