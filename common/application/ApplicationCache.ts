import Application from './Application';

class ApplicationCache {
  private applications: {
    [key: string]: Application;
  };

  public constructor () {
    this.applications = {};
  }

  public set ({ directory, application }: {
    directory: string;
    application: Application;
  }): void {
    this.applications[directory] = application;
  }

  public get ({ directory }: {
    directory: string;
  }): Application {
    return this.applications[directory];
  }
}

export default ApplicationCache;
