import { ApolloClient } from "apollo-client";
import { RetryLink } from "apollo-link-retry";
import { onError, ErrorResponse } from "apollo-link-error";
import { setContext } from "apollo-link-context";
import { InMemoryCache, IntrospectionFragmentMatcher } from "apollo-cache-inmemory"
import { split, from, Observable, FetchResult } from "apollo-link";
import { createUploadLink } from "apollo-upload-client";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { APIEnvironment, APIEnvironmentMap } from "./env";


/* create apollo clients option */
type CreateApolloClientOption = {
  // handler for unauthorized error
  onForbidden: (response: ErrorResponse, env: APIEnvironment) => Observable<FetchResult> | void
}


/* option preset for admin application */
export const createApolloClientAdminAppPresetOption: CreateApolloClientOption = {
  onForbidden: (response: ErrorResponse, env: APIEnvironment) => {
    console.error(response, "redirect to OAuth2 sign in page...");
    env.auth.requestAdminIdToken();
  }
};


/* create apollo clients for all API environments */
export type ApolloClientsForAllEnvironments = {
  [envKey: string]: ApolloClient<InMemoryCache> & { initCacheFragmentMatcher: () => Promise<void> }
};

export function createApolloClientsForAllEnvironments(opt: CreateApolloClientOption): ApolloClientsForAllEnvironments {
  return Object.keys(APIEnvironmentMap)
    .reduce((clients, envKey) => {
      clients[envKey] = createApolloClientForEnvironment(APIEnvironmentMap[envKey], opt);
      return clients
    }, {} as ApolloClientsForAllEnvironments);
}


/*
  create a single apollo client for given API environment
  supports:
  - authentication
  - retry on network failure
  - subscription (websocket)
  - multipart/form-data upload
  - cache fragment matcher: ref. https://www.apollographql.com/docs/react/advanced/fragments#fragment-matcher
*/
export function createApolloClientForEnvironment(env: APIEnvironment, opt: CreateApolloClientOption): ApolloClient<InMemoryCache> & { initCacheFragmentMatcher: () => Promise<void> } {
  const uri = `${env.url}/graphql`;

  const httpLink = from([
    // set authorization header
    setContext((operation, context) => {
      const token = env.auth.loadIdToken();
      return token ? { headers: { ...context.headers, authorization: `Bearer ${token}` } } : {}
    }),

    // recover from network error
    new RetryLink({
      delay: {
        initial: 100,
        max: Infinity,
        jitter: true,
      },
      attempts: {
        max: 3,
        retryIf(error, operation) {
          const statusCode = error && error.response && error.response.status || null;
          return statusCode === null || statusCode >= 500;
        },
      },
    }),

    // recover from logical error
    onError((errorResponse) => {
      const { graphQLErrors, networkError, operation, forward } = errorResponse;

      if (graphQLErrors) {
        for (let err of graphQLErrors) {
          switch (err.extensions.code) {
            case "FORBIDDEN":
              return opt.onForbidden(errorResponse, env);
            default:
              console.error(err);
          }
        }
      }

      if (networkError) {
        // @ts-ignore
        if (networkError.statusCode && networkError.statusCode == 401) {
          return opt.onForbidden(errorResponse, env);
        }
        console.error(networkError);
      }
    }),

    // base network interface
    createUploadLink({
      uri,
    }),
  ]);

  // to support websocket (subscription)
  const wsLink = new WebSocketLink({
    uri: uri.replace("http", "ws"),
    options: {
      reconnect: true,
      lazy: true,
      connectionParams: () => {
        const token = env.auth.loadIdToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }
  });

  const link = split(
    // split based on operation type
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query);
      return kind === "OperationDefinition" && operation === "subscription";
    },
    wsLink,
    httpLink,
  );

  const client = new ApolloClient<InMemoryCache>({
    link,
    queryDeduplication: true,
    ssrMode: false,
    cache: new InMemoryCache({
      addTypename: true,
    }) as any,
  }) as ApolloClient<InMemoryCache> & { initCacheFragmentMatcher: () => Promise<void> };

  // asynchronously load schema from server and update cache to fragment matcher ready cache
  client.initCacheFragmentMatcher = () => new Promise((resolve, reject) => {
    fetch(uri, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variables: {},
        query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
      }),
    })
      .then(res => res.json())
      .then(result => {
        // here we're filtering out any type information unrelated to unions or interfaces
        result.data.__schema.types = result.data.__schema.types.filter(
          (type: any) => type.possibleTypes !== null,
        );
        const introspectionQueryResultData = result.data;
        client.cache = new InMemoryCache({
          addTypename: true,
          fragmentMatcher: new IntrospectionFragmentMatcher(introspectionQueryResultData),
        }) as any;

        // now all done, override init method to prevent multiple initialization
        client.initCacheFragmentMatcher = () => Promise.resolve();
        resolve();
      })
      .catch(error => {
        console.error(`cannot make introspectionQueryResultData from GraphQL server: ${uri}`, error);
        reject(error);
      });
  });

  return client;
}