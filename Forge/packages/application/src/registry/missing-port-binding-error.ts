export class MissingPortBindingError extends Error {
  constructor(portDescription: string) {
    super(
      `No implementation is bound for port "${portDescription}". Register a plugin that binds it before use.`,
    );
    this.name = "MissingPortBindingError";
  }
}
