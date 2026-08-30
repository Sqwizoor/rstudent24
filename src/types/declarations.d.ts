declare module 'posthog-node' {
  export class PostHog {
    constructor(apiKey: string, options?: any);
    capture(event: any): void;
    identify(params: any): void;
    shutdown(): Promise<void>;
    debug(enabled?: boolean): void;
    [key: string]: any;
  }
}

declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query(queryTextOrConfig: any, values?: any): Promise<any>;
    end(): Promise<void>;
    [key: string]: any;
  }
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(queryTextOrConfig: any, values?: any): Promise<any>;
    end(): Promise<void>;
    [key: string]: any;
  }
  const pg: any;
  export default pg;
}
