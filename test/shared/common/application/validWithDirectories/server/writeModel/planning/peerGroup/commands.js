'use strict';

const commands = {
  /* eslint-disable no-unused-vars */
  start: {
    isAuthorized (peerGroup, command) {
      return true;
    },

    handle (peerGroup, command) {
      // ...
    }
  },

  join: {
    documentation: `
      # Joining a peer group

      The \`join\` command lets you join a peer group.
    `,

    schema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: true
    },

    isAuthorized (peerGroup, command) {
      return true;
    },

    handle (peerGroup, command) {
      // ...
    }
  }
  /* eslint-enable no-unused-vars */
};

module.exports = commands;
