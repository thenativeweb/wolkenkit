import defekt from 'defekt';

const errors = defekt([
  'DispatchFailed',
  'FileAlreadyExists',
  'FileNotFound',
  'ForwardFailed',
  'RequestFailed'
]);

export default errors;
