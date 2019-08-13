import CommandExternal from '../../../common/elements/CommandExternal';
import Course from 'marble-run';
import Dispatcher from '../Dispatcher';

declare type OnDispatchHandler = (args: { command: CommandExternal }) => Promise<void>;

class InMemoryDispatcher extends Dispatcher {
  protected course: Course;

  protected onDispatch: OnDispatchHandler;

  protected constructor ({ course, onDispatch }: {
    course: Course;
    onDispatch: OnDispatchHandler;
  }) {
    super();

    this.course = course;
    this.onDispatch = onDispatch;
  }

  public static async create ({ concurrency, onDispatch }: {
    concurrency: number;
    onDispatch: OnDispatchHandler;
  }): Promise<InMemoryDispatcher> {
    const course = new Course({ trackCount: concurrency });

    return new InMemoryDispatcher({ course, onDispatch });
  }

  public async schedule ({ command }: {
    command: CommandExternal;
  }): Promise<void> {
    const { course, onDispatch } = this;

    // We don't use await here because we are only interested in the fact that
    // the command was stored, not that it was actually handled.
    course.add({
      routingKey: command.aggregateIdentifier.id,
      id: command.id,
      async task (): Promise<void> {
        await onDispatch({ command });
      }
    });
  }
}

export default InMemoryDispatcher;
