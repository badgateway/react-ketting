import * as React from 'react';
import { useClient } from '../hooks/use-client';
import { oauth2 } from 'ketting';
import { OAuth2Token } from 'fetch-mw-oauth2';

const { useEffect, useState } = React;

const LOCALSTORAGEKEY = 'ketting-auth:3';

type Props = {
  /**
   * OAuth2 Client ID
   */
  clientId: string;

  /**
   * OAuth2 authorize endpoint.
   *
   * For example https://my-server/authorize
   */
  authorizeEndpoint: string;

  /**
   * OAuth2 token endpoint
   *
   * For example: https://my-server/token
   */
  tokenEndpoint: string;

  /**
   * If passed, this component will render while authentication is not yet
   * complete.
   */
  authenticatingComponent?: React.ReactNode;

  /**
   * Child components. Will only be rendered after authentication is complete
   */
  children: React.ReactNode;

  /**
   * Callback
   *
   * Will be triggered when authentication is successful
   */
  onSuccess: (state: string|null) => void;

  /**
   * After the authentication process is complete, this component will make 1
   * GET request to test if it actually worked.
   *
   * By default it will use the Ketting bookmark url, but this can be overridden
   * here.
   *
   * If it's set to "null", this test is skipped.
   */
  testEndpoint?: string

}

/**
 * The RequireLogin component ensures that a user is authenticated.
 *
 * Children will not be rendered until this is the case.
 */
const RequireLogin: React.FC<Props> = (props: Props) => {

  const [isAuthenticated, setAuthenticated] = useState(false);
  const client = useClient();
  const validateToken = async () => {

    const location = new URL(document.location.href);
    if (location.search) {
      // If we have a 'code' query parameter, the client will attempt to authenticate with
      // the code via oauth2 and attempt to redirect back to your url
      const searchParams = new URLSearchParams(location.search.substr(1));
      if (searchParams.has('code')) {
        const code: string = searchParams.get('code')!;

        // This 'state' is the OAuth2 state, and we're using it to put a
        // relative url where the user needs to go (in app) after
        // authentication.
        const state = searchParams.get('state') || null;
        await processCodeFromUrl(code, state);
        return;
      }
    }

    // If we got this far in the function, there was no 'code' in the url.
    // Lets check if we have credentials in LocalStorage.
    const localStorageAuth = window.localStorage.getItem(LOCALSTORAGEKEY);

    if(localStorageAuth){
      // this doesnt feel like a good variable name
      const parsedToken:OAuth2Token = JSON.parse(localStorageAuth);

      client.use(oauth2({
        grantType: undefined,
        clientId: props.clientId,
        tokenEndpoint: props.tokenEndpoint,
        onTokenUpdate: (token) => storeKettingCredentialsInLocalStorage(token),
        onAuthError: err => {
          console.error('[ketting] Got a deep 401 error, lets re-authenticate');

          // IF we got here it means we didn't have tokens in LocalStorage, or they
          // were expired.
          document.location.href = getAuthorizeUri(props);
        }
      }, parsedToken));
      // Lets test auth.
      try {
        if (props.testEndpoint === null) {
          console.info('[ketting] Using stored credentials. testEndpoint is disabled.');
          setAuthenticated(true);
        } else {
          const testResource = client.go(props.testEndpoint);
          console.info('[ketting] Testing stored credentials on %s', testResource.uri);
          await testResource.get();
          console.info('[ketting] Stored credentials were accepted');
          // Authentication succeeded
          setAuthenticated(true);

          // End function
          return;
        }
      } catch (err) {
        switch(err.httpCode) {
          case 400 :
            if (err.oauth2Code === 'invalid_grant') {
              console.info('Refresh token might already have been used, or invalid or expired. Lets re-authenticate');
            } else {
              console.error('[ketting] ', err);
              throw new Error('Got error while accessing api: ' + err.httpCode);
            }
            break;
          case 401 :
            console.info('[ketting] Stored credentials were not valid. Lets re-authenticate');
            break;
          default :
            console.error('[ketting] ', err);
            throw new Error('Got error while accessing api: ' + err.httpCode);
        }
      }
    } else {
      console.info('[ketting] No stored credentials. Redirecting to auth API api');
    }

    // IF we got here it means we didn't have tokens in LocalStorage, or they
    // were expired.
    document.location.href = getAuthorizeUri(props);
  }

  useEffect(() => {
    validateToken().catch(err => {
      console.error('[ketting] Error while validating token', err);
    });
  }, [client]);

  if (isAuthenticated) {
    return <>{props.children}</>;
  }

  /**
   * This function gets called when we get redirected back from a OAuth2
   * authorization endpoint.
   */
  const processCodeFromUrl = async  (code: string, state: string | null): Promise<void> => {

    client.use(oauth2({
      grantType: 'authorization_code',
      clientId: props.clientId,
      tokenEndpoint: props.tokenEndpoint,
      redirectUri: document.location.origin + '/',
      code: code,
      onTokenUpdate: (token) => storeKettingCredentialsInLocalStorage(token),
      onAuthError: err => {
        console.error('[ketting] Got a deep 401 error, lets re-authenticate');

        // IF we got here it means we didn't have tokens in LocalStorage, or they
        // were expired.
        document.location.href = getAuthorizeUri(props);
      }
    }));

    // Lets test authentication.
    try {
      await client.go().get();
    } catch (err) {
      throw new Error('Error from API after authenticating: ' + err);
    }

    setAuthenticated(true);
    props.onSuccess(state);
  }

  const storeKettingCredentialsInLocalStorage = async (token: OAuth2Token) => {
    // Store credentials.
    // ? Should this be custom-set by the user?
    window.localStorage.setItem(
      LOCALSTORAGEKEY,
      JSON.stringify(token)
    );
  }
  // We return a generic "Authenticating" component while the useEffect is...in effect
  // A custom "authenticating" component can also be passed in instead
  return (
    <>
      {props.authenticatingComponent ?
        (props.authenticatingComponent)
        :
        (
          <div className='authenticating'>
            <header><h1>Authenticating</h1></header>
        </div>
        )
      }
    </>
  );
}


/**
 * Generates the full URL to redirect the user to for the OAuth2 authorization
 * endpoint.
 */
function getAuthorizeUri(props: { clientId: string, authorizeEndpoint: string }): string {
  const currentRoot = document.location.origin + '/';
  const currentPath = document.location.pathname;

  const params = new URLSearchParams([
    ['response_type', 'code'],
    ['client_id', props.clientId],
    ['redirect_uri', currentRoot],
    ['state', currentPath],
  ]);

  return props.authorizeEndpoint + '?' + params.toString();
}

export { RequireLogin };
