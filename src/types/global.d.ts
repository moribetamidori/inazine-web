interface JQuery {
  turn(options?: any): JQuery;
  turn(command: string): JQuery;
  data(): any;
}

interface Window {
  $: typeof import('jquery');
} 