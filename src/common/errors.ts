import defekt from '@offspring/defekt';

const errors = defekt({
  DispatchFailed: { code: 'EFOO' },
  FileAlreadyExists: {},
  FileNotFound: {},
  ForwardFailed: {},
  RequestFailed: {}
});

export default errors;
