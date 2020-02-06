abstract class HttpClient {
  protected url: string;

  public constructor ({ protocol = 'http', hostName, port, path = '/' }: {
    protocol?: string;
    hostName: string;
    port: number;
    path?: string;
  }) {
    const url = `${protocol}://${hostName}:${port}${path}`;

    this.url = url.endsWith('/') ? url.slice(0, -1) : url;
  }
}

export { HttpClient };
