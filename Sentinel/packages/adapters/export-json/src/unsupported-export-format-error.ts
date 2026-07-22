export class UnsupportedExportFormatError extends Error {
  constructor(public readonly format: string) {
    super(`@sentinel/export-json does not support export format "${format}"`);
    this.name = "UnsupportedExportFormatError";
  }
}
