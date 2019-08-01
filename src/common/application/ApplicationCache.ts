import Application from './Application';

class ApplicationCache {
  private applications: Dictionary<string, Application>;

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
    const application = this.applications[directory];

    if (!application) {
      throw new Error('Application not found.');
    }

    return application;
  }
}

export default ApplicationCache;
