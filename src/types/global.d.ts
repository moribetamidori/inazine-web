interface TurnJsOptions {
  width?: number;
  height?: number;
  autoCenter?: boolean;
  display?: 'single' | 'double';
  acceleration?: boolean;
  elevation?: number;
  gradients?: boolean;
}

interface JQuery {
  turn(options?: TurnJsOptions): JQuery;
  turn(command: string): JQuery;
  data(): { turn?: boolean } | undefined;
}

interface Window {
  $: typeof import('jquery');
} 