import { Resource, State, HalState, Links } from 'ketting';

/**
 * A utility class for managing state changes to resources.
 *
 * This class can handle submitting a POST request to create a ne
 * resource, following a Location header and subsequent PUT
 * requests.
 */
export default class ResourceLifecycle<T> {

  currentState: State<T> | null;
  mode: 'PUT' | 'POST';
  currentResource: Resource<T>;

  constructor(resource: Resource<T>, mode: 'PUT' | 'POST', initialState: State<T> | undefined, onUpdate: (state: State<T>) => void) {

    if (mode==='POST' && !initialState) {
      throw new Error('In POST mode you must specifiy the "initialState" parameter');
    }
    this.currentResource = resource;
    this.mode = mode;
    this.currentState = initialState || null;

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
    }

  }

  setData(data: T): void {

    this.currentState = new HalState(
      'about:blank',
      data,
      new Headers(),
      new Links(),
      [],
    );

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

    this.currentResource.off('update', this.onUpdate);

  }

  private setupEvents() {

    if (this.mode === 'POST') {
      throw new Error('Update events cannot be subscribed to before the resource exists');
    }
    this.currentResource.on('update', this.onUpdate);

  }

  private onUpdate(state: State<T>) {

    this.currentState = state;

  }

}
