import defekt from '@offspring/defekt';

const errors = defekt({
  CommandMalformed: {},
  DispatchFailed: {},
  EventMalformed: {},
  EventUnknown: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  ForwardFailed: {},
  IdentifierMismatch: {},
  InvalidOperation: {},
  RequestFailed: {},
  TypeInvalid: {}
});

export default errors;
