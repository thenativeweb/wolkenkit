import defekt from 'defekt';

const errors = defekt({
  ApplicationNotFound: {},
  CommandMalformed: {},
  CompilationFailed: {},
  DispatchFailed: {},
  EventMalformed: {},
  EventUnknown: {},
  FileAlreadyExists: {},
  FileNotFound: {},
  ForwardFailed: {},
  IdentifierMismatch: {},
  InvalidOperation: {},
  NotAuthenticatedError: {},
  RequestFailed: {},
  TypeInvalid: {}
});

export default errors;
