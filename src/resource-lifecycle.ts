import { Resource, State, HalState, Links, isState } from 'ketting';

/**
 * A utility class for managing state changes to resources.
 *
 * This class can handle submitting a POST request to create a ne
 * resource, following a Location header and subsequent PUT
 * requests.
 */
export default class ResourceLifecycle<T extends any> {

  currentState: State<T> | null;
  mode: 'PUT' | 'POST';
  currentResource: Resource<T>;
  onUpdate: (newState: State<T>) => void;

  constructor(resource: Resource<T>, mode: 'PUT' | 'POST', initialState: State<T> | T | undefined, onUpdate: (state: State<T>) => void) {

    if (mode==='POST' && !initialState) {
      throw new Error('In POST mode you must specifiy the "initialState" parameter');
    }
    this.currentResource = resource;
    this.mode = mode;
    this.onUpdate = onUpdate;
    if (!initialState) {
      this.currentState = null;
    } else if (isState(initialState as any)) {
      this.currentState = initialState as State<T>;
    } else {
      this.currentState = dataToState(initialState) as State<T>;
    }
    if (mode === 'PUT') {
      this.setupEvents();
    }

  }

  async getState(): Promise<State<T>> {

    if (this.currentState) {
      return this.currentState;
    }
    return this.currentResource.get();

  }

  setState(state: State<T>): void {

    this.currentState = state;
    if (this.mode === 'PUT') {
      // Update the Ketting cache too.
      this.currentResource.updateCache(state);
    } else {
      // We only need to call onUpdate for the 'POST' case
      // because the regular 'update' event will handle the event for
      // existing resources.
      this.update(state);
    }

  }

  setData(data: T): void {

    if (this.currentState) {
      this.currentState.data = data;
    } else {
      this.currentState = dataToState(data);
    }

  }

  async submit(): Promise<void> {

    if (this.mode === 'POST') {
      // Create new resource.
      const newResource = await this.currentResource.postFollow(this.currentState!);
      this.currentResource = newResource;
      this.mode = 'PUT';
      this.currentState = await newResource.get();
      this.setupEvents();
    } else {
      await this.currentResource.put(this.currentState!);
    }

  }

  public cleanup() {

    this.currentResource.off('update', this.update);

  }

  private setupEvents() {

    if (this.mode === 'POST') {
      throw new Error('Update events cannot be subscribed to before the resource exists');
    }
    this.currentResource.on('update', this.update);

  }

  private update(state: State<T>) {

    this.currentState = state;
    this.onUpdate(state);

  }

}


/**
 * Take data and wraps it in a State object.
 *
 * For now this will always return a HalState object, because it's a
 * reasonable default, but this may change in the future.
 */
function dataToState<T>(data: T): State<T> {

  return new HalState(
    'about:blank',
    data,
    new Headers(),
    new Links('about:blank'),
    [],
  );

}
