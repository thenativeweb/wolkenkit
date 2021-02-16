import axios, { AxiosInstance } from 'axios';

const validateStatus = function (): boolean {
  return true;
};

abstract class HttpClient {
  protected url: string;

  protected axios: AxiosInstance;

  public constructor ({ protocol = 'http', hostName, portOrSocket, path = '/' }: {
    protocol?: string;
    hostName: string;
    portOrSocket: number | string;
    path?: string;
  }) {
    const url = typeof portOrSocket === 'number' ?
      `${protocol}://${hostName}:${portOrSocket}${path}` :
      `${protocol}://${hostName}${path}`;

    this.url = url.endsWith('/') ? url.slice(0, -1) : url;

    this.axios = typeof portOrSocket === 'number' ?
      axios.create({
        validateStatus
      }) :
      axios.create({
        socketPath: portOrSocket,
        validateStatus
      });
  }
}

export { HttpClient };
