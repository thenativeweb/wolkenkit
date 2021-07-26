import ws from 'ws';
import { ApolloLink, FetchResult, Observable, Operation } from '@apollo/client';
import { Client, ClientOptions, createClient } from 'graphql-ws';
import { GraphQLError, print } from 'graphql';

// This snippet is taken from an example in the
// [graphql-ws readme](https://github.com/enisdenjo/graphql-ws).
class WebSocketLink extends ApolloLink {
  private readonly client: Client;

  public constructor (options: ClientOptions) {
    super();
    this.client = createClient({
      ...options,
      webSocketImpl: ws
    });
  }

  public request (operation: Operation): Observable<FetchResult> {
    return new Observable((sink): () => void => this.client.subscribe<FetchResult>(
      { ...operation, query: print(operation.query) },
      {
        next: sink.next.bind(sink),
        complete: sink.complete.bind(sink),
        error (err): void {
          if (err instanceof Error) {
            return sink.error(err);
          }

          if (err instanceof CloseEvent) {
            return sink.error(

              // Reason will be available on clean closes
              new Error(
                `Socket closed with event ${err.code} ${err.reason || ''}`
              )
            );
          }

          sink.error(
            new Error(
              (err as GraphQLError[]).
                map(({ message }): string => message).
                join(', ')
            )
          );
        }
      }
    ));
  }
}

export {
  WebSocketLink
};
