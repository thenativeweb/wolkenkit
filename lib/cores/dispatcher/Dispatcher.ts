import CommandExternal from '../../common/elements/CommandExternal';
import Course from 'marble-run';

declare type OnDispatchHandler = (args: { command: CommandExternal }) => Promise<void>;

declare class Dispatcher {
  protected course: Course;

  protected onDispatch: OnDispatchHandler;

  public static create ({ concurrency, onDispatch }: {
    concurrency: number;
    onDispatch: OnDispatchHandler;
  }): Promise<Dispatcher>;

  public schedule ({ command }: {
    command: CommandExternal;
  }): Promise<void>;
}

export default Dispatcher;
