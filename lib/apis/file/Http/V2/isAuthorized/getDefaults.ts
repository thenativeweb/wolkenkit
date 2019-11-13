import { AuthorizationOptions } from './AuthorizationOptions';

const getDefaults = (): AuthorizationOptions => {
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

export { getDefaults };
