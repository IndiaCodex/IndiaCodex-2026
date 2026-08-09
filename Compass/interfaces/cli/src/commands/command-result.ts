/** Every command returns rendered text plus the process exit code it warrants — printing and file output are the CLI shell's job, not the command's (docs/architecture/interfaces.md). */
export interface CommandResult {
  readonly output: string;
  readonly exitCode: number;
}
