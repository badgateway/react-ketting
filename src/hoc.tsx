import { Resource, State } from 'ketting';
import * as React from 'react';

/**
 * The list of properties this HoC
 * will pass to the wrapped component
 */
type PassedProps<T> = {
  resource: Resource<T>,
  resourceState: State<T> | null,
  data: T | null,
}

type HocState<T> = {
  resourceState: State<T> | null,
  data: T | null,
}

/**
 * A Higher order component for listening to Ketting state.
 *
 * Wrapping your component using withResource will add the following props
 * to your component:
 *
 * * resourceState
 * * data
 *
 * 'resourceState' will refer to the result of a Ketting Resource.get() State
 * object, renamed to 'resourceState' to avoid confusion with react state.
 * ' data' is the 'body' of the result.
 */
export function withResource<TProps extends { resource: Resource<TResourceBody> }, TResourceBody>(
  WrappedComponent: React.ComponentType<TProps & PassedProps<TResourceBody>>
  ): React.ComponentType<TProps> {

  return class extends React.Component<TProps, HocState<TResourceBody>> {

    constructor(props: TProps, children?: React.ReactNode) {
      super(props, children);
      this.state = {
        resourceState: null,
        data: null,
      };
    }

    async componentDidMount() {
      const resourceState = await this.props.resource.get();
      this.setState({
        resourceState,
        data: resourceState.body
      });
    }

    componentWillUnmount() {
      // unsub
    }

    render() {
      return <WrappedComponent resource={this.props.resource} resourceState={this.state.resourceState} data={this.state.data} {...this.props} />;
    }

  }

}
