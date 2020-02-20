const sampleCommand = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      additionalProperties: false
    };
  },

  isAuthorized () {
    return true;
  },

  handle (state, command, { aggregate }) {
    aggregate.publishDomainEvent('sampleEvent', {});
  }
};

module.exports = {
  sampleCommand
};
