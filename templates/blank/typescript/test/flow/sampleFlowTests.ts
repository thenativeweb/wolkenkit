import { assert } from 'assertthat';
import path from 'path';
import { uuid } from 'uuidv4';
import { Application, loadApplication, LoggerService, sandbox } from 'wolkenkit';

suite('sampleFlow', (): void => {
  let application: Application;

  setup(async (): Promise<void> => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  test('logs domain events.', async (): Promise<void> => {
    const aggregateId = uuid(),
          timestamp = Date.now();

    const logMessages: { level: string; message: string; metadata?: object }[] = [];

    await sandbox().
      withApplication({ application }).
      withLoggerServiceFactory({
        loggerServiceFactory (): LoggerService {
          return {
            fatal (message: string, metadata?: object): void {
              logMessages.push({ level: 'fatal', message, metadata });
            },
            error (message: string, metadata?: object): void {
              logMessages.push({ level: 'error', message, metadata });
            },
            warn (message: string, metadata?: object): void {
              logMessages.push({ level: 'warn', message, metadata });
            },
            info (message: string, metadata?: object): void {
              logMessages.push({ level: 'info', message, metadata });
            },
            debug (message: string, metadata?: object): void {
              logMessages.push({ level: 'debug', message, metadata });
            }
          } as LoggerService;
        }
      }).
      forFlow({ flowName: 'sampleFlow' }).
      when({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleDomainEvent',
        data: {},
        metadata: {
          revision: 1,
          timestamp
        }
      }).
      then(async (): Promise<void> => {
        assert.that(logMessages.length).is.equalTo(1);
        assert.that(logMessages[0]).is.atLeast({
          level: 'info',
          message: 'Received domain event.'
        });
      });
  });
});
