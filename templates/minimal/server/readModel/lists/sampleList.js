'use strict';

const fields = {
  sampleField: { initialState: '', fastLookup: true }
};

const projections = {
  async 'sampleContext.sampleAggregate.sampleEvent' (sampleList, event) {
    sampleList.add({
      // ...
    });
  }
};

module.exports = { fields, projections };
