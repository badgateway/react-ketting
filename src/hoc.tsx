import { Resource, State } from 'ketting';
import * as React from 'react';

/**
 * The list of properties this HoC
 * will pass to the wrapped component
 */
type PassedProps<T> = {
  resource: Resource<T>;
  resourceState: State<T> | null;
  data: T | null;
}

type HocState<T> = {
  resourceState: State<T> | null;
  data: T | null;
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
      this.onStateUpdateEvent = this.onStateUpdateEvent.bind(this);
    }

    async componentDidMount() {
      const resourceState = await this.props.resource.get();
      this.setState({
        resourceState,
        data: resourceState.data
      });
      this.props.resource.on('update', this.onStateUpdateEvent);
    }

    componentWillUnmount() {

      this.props.resource.off('update', this.onStateUpdateEvent);

    }

    async onStateUpdateEvent(state: State) {

      this.setState({
        resourceState: state,
        data: state.data
      });

    }

    render() {
      return <WrappedComponent resourceState={this.state.resourceState} data={this.state.data} {...this.props} />;
    }

  };

}
