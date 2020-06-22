// tslint:disable no-console
import * as React from 'react';
import { getKettingContext } from './provider';
import { Client, Resource, oauth2 } from 'ketting';
import { useHistory } from 'react-router-dom';

type Props = {
  client?: Client;
  testEndpoint?: string | Resource;
  clientId: string;
  tokenEndpoint: string;
  authorizeEndpoint: string;
  loading: React.ReactNode;
}

type AuthState = 'no-auth' | 'creds-setup' | 'authenticated';

type TokenSet = {
  accessToken: string;
  expiresAt: number | null;
  refreshToken: string | null;
};

export const RequireLogin: React.FC<Props> = (props) => {
 
  const context = React.useContext(getKettingContext());
  let client: Client;
  if (props.client) {
    client = props.client;
  } else if (context.client) {
    client = context.client;
  } else {
    throw new Error('The RequireLogin requires either a "client" property or a KettingProvider component higher up in the chain');
  }

  const [authState, setAuthState] = React.useState<AuthState>('no-auth');


  React.useEffect(() => {

    const storeTokens = (tokens: TokenSet) => {
      console.log('Store new oauth2 tokens');
      window.localStorage.setItem('ketting-auth:v3', JSON.stringify(tokens));
    }

    /**
     * This function gets called when we get redirected back from a OAuth2
     * authorization endpoint.
     */
    const processCodeFromUrl = (code: string, redirectAfter: string): void => {

      client.use(oauth2({
        grantType: 'authorization_code',
        clientId: props.clientId,
        tokenEndpoint: props.tokenEndpoint,
        redirectUri: document.location.origin + '/',
        code: code,
        onTokenUpdate: (token: TokenSet) => storeTokens(token),
      }));

      setAuthState('creds-setup');
      const history = useHistory();
      history.push(redirectAfter);
    }

    const processTokenFromLS = (tokens: TokenSet) => {
      client.use(oauth2({
        grantType: undefined,
        clientId: props.clientId,
        tokenEndpoint: props.tokenEndpoint,
        onTokenUpdate: (token: TokenSet) => storeTokens(token),
        refreshToken: tokens.refreshToken!,
        accessToken: tokens.accessToken,
      }));
      setAuthState('creds-setup');

    };

    const initiateAuthFlow = () => {

      const currentRoot = document.location.origin + '/';
      const currentPath = document.location.pathname;

      const params = new URLSearchParams([
        ['response_type', 'code'],
        ['client_id', props.clientId],
        ['redirect_uri', currentRoot],
        ['state', currentPath],
      ]);

      console.log('Redirecting to OAuth2 authorization endpoint');
      document.location.href = props.authorizeEndpoint + '?' + params.toString();
      
    };

    const testCredentials = () => {

      const testResource = props.testEndpoint instanceof Resource ? props.testEndpoint : client.go(props.testEndpoint);
      
      testResource.refresh()
        .then( () => {
          console.log('Credentials accepted');
          setAuthState('authenticated');
        })
        .catch( (err:any) => {
          if (err.httpCode !== 401) {
            const newErr = new Error('Got error when accessing test endpoint: ' + err.httpCode);
            console.error(newErr);
            console.error(err);
            throw newErr;
          } else {
            console.log('Credentials rejected. Attempting a fresh login');
            initiateAuthFlow();
          }
        });

    }

    if (authState === 'no-auth') {
      // First, we should see if we got here after a redirect back
      // an OAuth2 authentication process.
      //
      // If this is the case, we'll have a `code` parameter in the url.
      const location = new URL(document.location.href);
      if (location.search) {

        const searchParams = new URLSearchParams(location.search.substr(1));
        if (searchParams.has('code')) {
          console.log('Got authorization code from redirect');
          const code: string = searchParams.get('code')!;
          const redirectAfter: string = searchParams.get('state') || '/';
          processCodeFromUrl(code, redirectAfter);
          return;
        }
      }

      // Do we have credentials in LocalStorage?
      const ls = window.localStorage.getItem('ketting-auth:v3');
      if (ls) {
        const tokens:TokenSet = JSON.parse(ls);
        console.log('Got credentials from localstorage');
        processTokenFromLS(tokens);
        return;
      }

      // No 'code' or stored credentials, lets do a new auth flow.
      initiateAuthFlow();

    }

    if (authState === 'creds-setup') {
      // We have credentials, lets make sure they are correct.
      if (!props.testEndpoint) {
        console.log('No test endpoint. Presuming credentials are valid');
        setAuthState('authenticated');
      } else {
        testCredentials();
      }
    }

  }, [authState, client]);

  switch(authState) {
    case 'no-auth': 
    case 'creds-setup' :
      return <>{props.loading || 'Authenticating...'}</>;
    case 'authenticated':
      return <>{props.children}</>;
  }

}
