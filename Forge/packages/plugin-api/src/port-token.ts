export interface PortToken<T> {
  readonly key: symbol;
  readonly description: string;
  readonly _phantom?: T;
}

export function createPortToken<T>(description: string): PortToken<T> {
  return { key: Symbol(description), description };
}
