'use strict';

const events = {
  /* eslint-disable no-unused-vars */
  started: {
    handle (peerGroup, event) {
      // ...
    },

    isAuthorized (peerGroup, event) {
      return true;
    }
  },

  joined: {
    documentation: `
      # Having joined a peer group

      The \`joined\` event notifies you when a participant joined a peer group.
    `,

    schema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: true
    },

    handle (peerGroup, event) {
      // ...
    },

    isAuthorized (peerGroup, event) {
      return true;
    },

    filter (peerGroup, event) {
      return true;
    },

    map (peerGroup, event) {
      return event;
    }
  }
  /* eslint-enable no-unused-vars */
};

module.exports = events;
