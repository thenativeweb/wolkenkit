const sampleDomainEvent = {
  getSchema () {
    return {
      type: 'object',
      properties: {},
      additionalProperties: false
    };
  },

  handle (state) {
    return {
      domainEventNames: [ ...state.domainEventNames, 'sampleDomainEvent' ]
    };
  },

  isAuthorized () {
    return true;
  }
};

module.exports = {
  sampleDomainEvent
};
