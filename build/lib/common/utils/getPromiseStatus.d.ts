declare const getPromiseStatus: (promise: Promise<any>) => Promise<'resolved' | 'pending' | 'rejected'>;
export { getPromiseStatus };
