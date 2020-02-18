import { defekt } from 'defekt';

const errors = defekt({
  AcquireLockFailed: {},
  LockNameTooLong: {},
  ReleaseLockFailed: {},
  RenewLockFailed: {},
  ExpirationInPast: {}
});

export { errors };
