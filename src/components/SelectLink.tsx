import * as React from 'react';
import { ResourceLike } from '../util';
import { useReadResource } from '../hooks/use-read-resource';

type Props = {
  resource: ResourceLike<any>;
  rel?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function SelectLink(prop: Props) {

  const {resource, rel, ...selectProps} = prop;
  const { resourceState, loading, error } = useReadResource(resource, {});

  if (loading) {
    return <select {...selectProps}><option disabled>Loading...</option></select>;
  }
  if (error) throw error;

  const links = resourceState.links.getMany(rel ?? 'item');

  return <select {...selectProps}>
    {selectProps.children}
    {links.map(link => {
      return <option value={link.href} key={link.href}>{link.title}</option>;
    })}
  </select>;

}
