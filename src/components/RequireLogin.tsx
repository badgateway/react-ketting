import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useClient } from '../hooks/use-client';
import { oauth2 } from 'ketting';

type Props = {
  clientId: string;
  authorizeEndpoint: string;
  tokenEndpoint: string;
  authenticatingComponent?: React.ReactNode; 
  children: React.ReactNode;
}

const RequireLogin: React.FC<Props> = (props: Props) => {

  const [isAuthenticated, setAuthenticated] = useState(false);
  const client = useClient();

  useEffect(() => {
    validateToken().catch(err => {
      console.error('Error while validating token', err);
    });
  }, [client]);

  if (isAuthenticated) {
    return <>{props.children}</>;
  }

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
            const redirectAfter: string = searchParams.get('state') || '/';
            await processCodeFromUrl(code, redirectAfter);
        }
    }

    // If we got this far in the function, there was no 'code' in the url.
    // Lets check if we have credentials in LocalStorage.
    const localStorageAuth = window.localStorage.getItem('ketting-auth:2');

    if(localStorageAuth){
      // this doesnt feel like a good variable name
      const parsedToken = JSON.parse(localStorageAuth);

      client.use(oauth2({
        grantType: undefined,
        clientId: props.clientId,
        refreshToken: parsedToken.refreshToken,
        accessToken: parsedToken.accessToken,
        tokenEndpoint: props.tokenEndpoint,
        onTokenUpdate: (token) => storeKettingCredentialsInLocalStorage(token),
      }));
      // Lets test auth.
      try {
        await client.go().get();
        // Keep this message?
        console.log('Stored credentials were accepted');
        // Authentication succeeded
        setAuthenticated(true);

        // End function
        return;
      } catch (err) {
        if (err.httpCode !== 401) {
          console.error(err);
          throw new Error('Got error while accessing api: ' + err.httpCode);
        } else {
          console.log('Stored credentials were not valid. Lets re-authenticate');
          // Ignore 401 errors, we're gonna re-authenticate
        }
      }
    } else {
      console.log('No stored credentials. Redirecting to auth API api');
    }

    // IF we got here it means we didn't have tokens in LocalStorage, or they
    // were expired.
    document.location.href = await getAuthorizeUri();
  }

  /**
   * This function generates the full OAuth2 authorize urls.
   */
  const getAuthorizeUri = async () =>  {

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

  /**
   * This function gets called when we get redirected back from a OAuth2
   * authorization endpoint.
   */
  const processCodeFromUrl = async  (code: string, redirectAfter: string): Promise<void> => {

    client.use(oauth2({
      grantType: 'authorization_code',
      clientId: props.clientId,
      tokenEndpoint: props.tokenEndpoint,
      redirectUri: document.location.origin + '/',
      code: code,
      onTokenUpdate: (token) => storeKettingCredentialsInLocalStorage(token),
    }));

    // Lets test authentication.
    try {
      await client.go().get();
    } catch (err) {
      throw new Error('Error from API after authenticating: ' + err);
    }

    setAuthenticated(true);
    const history = useHistory();
    history.push(redirectAfter);
  }

  const storeKettingCredentialsInLocalStorage = async (token: any) => {
    // Store credentials.
    // ? Should this be custom-set by the user?
    window.localStorage.setItem(
      'ketting-auth:2',
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

export { RequireLogin };
