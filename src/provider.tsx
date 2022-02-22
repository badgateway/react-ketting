import * as React from 'react';
import { Client } from 'ketting';

type Props = {
  client: Client;
  children: React.ReactNode | React.ReactNode[] | null;
};

export type KettingContext = {
  client?: Client;
};

const KettingContext = React.createContext<KettingContext>({});

export function getKettingContext(): React.Context<KettingContext> {

  return KettingContext;

}

export const KettingProvider: React.FC<Props> = ({client, children}) => {

  const Context = getKettingContext();

  const contextValue: KettingContext = {
    client
  };
  return <Context.Provider value={contextValue}>
    {children}
  </Context.Provider>;

};
