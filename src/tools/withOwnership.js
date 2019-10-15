'use strict';

const humanizeString = require('humanize-string');

const forOwner = require('./forOwner'),
      transferOwnership = require('./transferOwnership');

const withOwnership = function (aggregate) {
  if (aggregate.initialState.owner) {
    throw new Error(`State property 'owner' is already being used.`);
  }
  if (aggregate.commands.transferOwnership) {
    throw new Error(`Command name 'transferOwnership' is already being used.`);
  }
  if (aggregate.events.transferredOwnership) {
    throw new Error(`Event name 'transferredOwnership' is already being used.`);
  }

  const modifiedAggregate = { ...aggregate };

  modifiedAggregate.initialState.owner = undefined;

  modifiedAggregate.commands.transferOwnership = {
    isAuthorized: forOwner(),

    handle (aggregateInstance, command) {
      try {
        if (!aggregateInstance.exists()) {
          const aggregateName = humanizeString(command.aggregate.name);

          throw new Error(`${aggregateName} does not exist.`);
        }

        transferOwnership(aggregateInstance, { to: command.data.to });
      } catch (ex) {
        return command.reject(ex.message);
      }
    }
  };

  modifiedAggregate.events.transferredOwnership = {
    handle (aggregateInstance, event) {
      aggregateInstance.setState({
        owner: event.data.to
      });
    },

    isAuthorized (aggregateInstance, event, { client }) {
      if (event.data.to === client.user.id) {
        return true;
      }

      if (event.data.from && event.data.from === client.user.id) {
        return true;
      }

      return false;
    }
  };

  return modifiedAggregate;
};

module.exports = withOwnership;
