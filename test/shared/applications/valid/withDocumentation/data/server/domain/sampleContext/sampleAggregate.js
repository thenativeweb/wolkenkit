'use strict';

const { initialState, commands, events } = require('../../../base/server/domain/sampleContext/sampleAggregate');

commands.execute.documentation = `
  # Sample aggregate

  ## Execute
`;

events.executed.documentation = `
  # Sample aggregate

  ## Executed
`;

module.exports = { initialState, commands, events };
