import defekt from '@offspring/defekt';

const errors = defekt({
  DispatchFailed: {},
  EventUnknown: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  ForwardFailed: {},
  IdentifierMismatch: {},
  RequestFailed: {},
  TypeInvalid: {}
});

export default errors;
