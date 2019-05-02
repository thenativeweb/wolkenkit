'use strict';

const getDefaults = function () {
  const result = {
    commands: {
      removeFile: {
        forAuthenticated: false,
        forPublic: false
      },
      transferOwnership: {
        forAuthenticated: false,
        forPublic: false
      },
      authorize: {
        forAuthenticated: false,
        forPublic: false
      }
    },
    queries: {
      getFile: {
        forAuthenticated: false,
        forPublic: false
      }
    }
  };

  return result;
};

module.exports = getDefaults;
