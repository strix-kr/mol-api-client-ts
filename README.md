# Moleculer API Gateway Client Library (TypeScript)

- Implemented for `gw[.dev|.latest].strix.co.kr`: ref. [mol-api](https://github.com/strix-kr/mol-api)
- Not bounded to neither `Vue.js` nor `React.js`.


## 1. Features
  - [x] API endpoint for each environments (prod/dev/latest/local)
  - [ ] Authentication service for each environment
    - [x] IAM Admin App
    - [ ] IAM User App
  - [x] Apollo GraphQL client preset for each environment with supports of
    - [x] authentication
    - [x] custom callback for authentication/authorization failure
    - [x] subscription (websocket)
    - [x] multipart/form-data upload (file)
    - [x] retry on network failure 
  - [ ] <s>REST client</s>
 
 
## 2. Install
```bash
$ npm i -S https://github.com/strix-kr/mol-api-client-ts
```

## 3. GraphQL Schema IDE Support (optional)
If you want to use GraphQL schema validation and auto-completion feature, follow below instructions.

After package installed, there would be made a copy of `.graphqlconfig` in local project directory.
That file is supported by some IDE including JetBrains.

For JetBrains IDE, install `JS GraphQL` plugin and enable it. In addition to here, you need `graphql-cli` binary which has utility features for GraphQL client application development.
 ```bash
$ sudo npm i -g graphql-cli
 ```
 
Now let's try to get the schema.
```bash
$ graphql get-schema -e dev
endpoint dev - Schema file was created: .schema.graphql

$ graphql schema-status            
schemaPath      .schema.graphql
    source      https://gw.dev.strix.co.kr/graphql
 timestamp      Fri Apr 19 2019 19:23:38 GMT+0900 (Korean Standard Time)
```

That's all, now your IDE may recognize your `gql` tags and could validate it.


## 4. Examples

### 4-1. Admin Application with GraphQL client
[./examples/admin-app.ts](./examples/admin-app.ts)
```ts
import { APIEnvironmentMap, createApolloClientForEnvironment, createApolloClientAdminAppPresetOption } from "mol-api-client-ts";
import gql from "graphql-tag";


/*
  There are local,dev,latest (k8s dev namespace) and prod (k8s prod namespace) environment types.
  So get your current environment from somewhere
*/
const currentEnv = location.host == "myapp.strix.co.kr" ? "prod" : "dev";
const env = APIEnvironmentMap[currentEnv];


/*
  At entry script, test current user has token and is authorized.
  Be noted that Google OAuth2 ID token has exact one hour of expiry (it is forced).
*/
env.auth.verifyAdminIdToken()
  .then(async (admin) => {
    /* it will make a redirection for OAuth2 login */
    if (!admin) {
      env.auth.requestAdminIdToken();
    }


    /* here comes authorized user entry logic: app rendering or whatever */
    console.log(admin, "signed in");


    /*
      Apollo client will embed current token automatically.
      When token expired so got 401/403 response, it will automatically make a redirection to login page again.
      See the error handle logic in "createApolloClientAdminAppPresetOption".
    */
    const apolloClient = createApolloClientForEnvironment(env, createApolloClientAdminAppPresetOption);

    /*
      Advanced: if you need FragmentMatcher for accurate fragment matching on unions and interfaces.
      call "initCacheFragmentMatcher" to replace apollo cache to fragment matcher ready cache.
      ref: https://www.apollographql.com/docs/react/advanced/fragments#fragment-matcher
     */
    await apolloClient.initCacheFragmentMatcher();

    await apolloClient.query({
      query: gql`
        query {
          # Write your query or whatever
          __typename
        }
      `
    })
    .then(({ data, errors }) => {
      // ...
    })
    .catch(error => {
      // ...
    });


    /* REST api call with native fetch method */
    const token = env.auth.loadIdToken();
    await fetch(`${env.url}/file`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error(error);
      })

    // ...
  });
```

## 5. Contribution

- `npm run dev` for watching and compile
- `npm run build` for compile
