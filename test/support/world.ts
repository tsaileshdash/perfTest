import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

export class ApiWorld extends World<IWorldOptions> {
  public baseUrl: string = '';
  public response: any;

  constructor(options: IWorldOptions) {
    super(options);
    this.response = null;
  }
}

setWorldConstructor(ApiWorld);
