'use strict';

const writeModel = {
  planning: {
    peerGroup: {
      initialState: {
        initiator: undefined,
        destination: undefined,
        participants: []
      },
      commands: {
        start: {
          isAuthorized () {
            return true;
          },

          handle () {
            // ...
          }
        },
        join: {
          isAuthorized () {
            return true;
          },

          handle () {
            // ...
          }
        }
      },
      events: {
        started: {
          handle (peerGroup, event) {
            peerGroup.setState({
              initiator: event.data.initiator,
              destination: event.data.destination
            });
          },

          isAuthorized () {
            return true;
          }
        },

        joined: {
          schema: {
            type: 'object',
            properties: {
              participant: { type: 'string', minLength: 1 }
            },
            required: [ 'participant' ],
            additionalProperties: false
          },

          handle (peerGroup, event) {
            peerGroup.setState({
              participants: [ ...peerGroup.state.participants, event.data.participant ]
            });
          },

          isAuthorized () {
            return true;
          }
        }
      }
    }
  }
};

module.exports = writeModel;
