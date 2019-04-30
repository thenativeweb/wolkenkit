'use strict';

const fields = {
  createdAt: { initialState: 0 },
  updatedAt: { initialState: undefined },
  strategy: { initialState: '' }
};

const projections = {
  'sampleContext.sampleAggregate.executed' (sampleList, event) {
    const { id } = event.aggregate;
    const { strategy } = event.data;
    const { timestamp } = event.metadata;

    sampleList.add({ createdAt: timestamp, strategy }).orUpdate({
      where: { id },
      set: { updatedAt: timestamp }
    });
  }
};

const queries = {
  readItem: {
    isAuthorized () {
      return true;
    }
  }
};

module.exports = { fields, projections, queries };
