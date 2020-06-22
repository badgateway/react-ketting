import { useContext } from 'react';
import { getKettingContext } from '../provider';
import { Client } from 'ketting';

export function useClient(): Client {

  const kettingContext = useContext(getKettingContext());
  if (!kettingContext.client) {
    throw new Error('To use useClient, you must have a <KettingProvider> component set up');
  }

  return kettingContext.client;

}
