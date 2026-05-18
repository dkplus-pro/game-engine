export interface Resource {
  url: string;
  loaded: boolean;
  data: any;
}

export interface ResourceLoader {
  load(url: string): Promise<Resource>;
  unload(url: string): void;
}
