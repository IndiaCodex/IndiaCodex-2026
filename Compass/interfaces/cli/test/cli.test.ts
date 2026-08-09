import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { CliToolError } from '../src/errors.js';
import type { CliIo, RuntimeFactory } from '../src/cli.js';
import { APP_COMPONENT, APP_RELEASE_ID, buildTestEcosystem, LATER, LIB_COMPONENT, LIB_RELEASE_2 } from './test-ecosystem.js';

function captureIo(): { io: CliIo; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { io: { print: (text) => stdout.push(text), printError: (text) => stderr.push(text) }, stdout, stderr };
}

async function preIngestedRuntimeFactory(): Promise<RuntimeFactory> {
  const { runtimeV1 } = buildTestEcosystem();
  await runtimeV1.ingestSnapshot.execute();
  return () => runtimeV1;
}

const freshRuntimeFactory: RuntimeFactory = () => buildTestEcosystem().runtimeV1;

describe('runCli', () => {
  it('prints usage and exits 0 for --help', async () => {
    const { io, stdout } = captureIo();
    const exitCode = await runCli(['--help'], io, freshRuntimeFactory);
    expect(exitCode).toBe(0);
    expect(stdout.join('\n')).toContain('forge-midnight <command> [options]');
  });

  it('prints usage and exits 2 when no command is given', async () => {
    const { io, stdout } = captureIo();
    const exitCode = await runCli([], io, freshRuntimeFactory);
    expect(exitCode).toBe(2);
    expect(stdout.join('\n')).toContain('forge-midnight <command> [options]');
  });

  it('exits 2 for an unknown command', async () => {
    const { io, stderr } = captureIo();
    const exitCode = await runCli(['not-a-real-command'], io, freshRuntimeFactory);
    expect(exitCode).toBe(2);
    expect(stderr.join('\n')).toContain('Unknown command "not-a-real-command"');
  });

  it('runs analyze end to end and prints its output', async () => {
    const { io, stdout } = captureIo();
    const exitCode = await runCli(['analyze'], io, freshRuntimeFactory);
    expect(exitCode).toBe(0);
    expect(stdout.join('\n')).toContain('Snapshot');
  });

  it('runs matrix against a pre-ingested runtime and honors --format html', async () => {
    const factory = await preIngestedRuntimeFactory();
    const { io, stdout } = captureIo();

    const exitCode = await runCli(['matrix', '--format', 'html'], io, factory);

    expect(exitCode).toBe(0);
    expect(stdout.join('\n')).toContain('<table class="compatibility-matrix">');
  });

  it('writes output to --out instead of stdout', async () => {
    const factory = await preIngestedRuntimeFactory();
    const { io, stdout } = captureIo();
    const dir = mkdtempSync(join(tmpdir(), 'forge-midnight-cli-test-'));
    const outPath = join(dir, 'matrix.md');

    const exitCode = await runCli(['matrix', '--out', outPath], io, factory);

    expect(exitCode).toBe(0);
    expect(stdout).toEqual([]);
    expect(readFileSync(outPath, 'utf8')).toContain('| Component | Depends on | Status | Relationships |');
  });

  it('maps a CliToolError to exit code 2 with a printed message', async () => {
    const { io, stderr } = captureIo();
    const exitCode = await runCli(['compatibility'], io, freshRuntimeFactory); // missing required --target
    expect(exitCode).toBe(2);
    expect(stderr.join('\n')).toContain('compatibility requires --target');
  });

  it('maps an unexpected error (e.g. no snapshot yet) to exit code 2', async () => {
    const { io, stderr } = captureIo();
    const exitCode = await runCli(['matrix'], io, freshRuntimeFactory); // fresh runtime, nothing ingested yet
    expect(exitCode).toBe(2);
    expect(stderr.join('\n')).toContain('Error:');
  });

  it('exits 2 with a message for an unrecognized flag', async () => {
    const { io, stderr } = captureIo();
    const exitCode = await runCli(['analyze', '--not-a-real-flag'], io, freshRuntimeFactory);
    expect(exitCode).toBe(2);
    expect(stderr.join('\n')).not.toBe('');
  });

  it('runs graph end to end', async () => {
    const factory = await preIngestedRuntimeFactory();
    const { io, stdout } = captureIo();

    const exitCode = await runCli(['graph'], io, factory);

    expect(exitCode).toBe(0);
    expect(stdout.join('\n').startsWith('graph LR')).toBe(true);
  });

  it('runs compatibility end to end with a subject and stack', async () => {
    const factory = await preIngestedRuntimeFactory();
    const { io, stdout } = captureIo();

    const exitCode = await runCli(
      ['compatibility', '--target', LIB_RELEASE_2, '--component', APP_COMPONENT.id, '--stack', APP_RELEASE_ID],
      io,
      factory,
    );

    expect(exitCode).toBe(0);
    expect(stdout.join('\n')).toContain('### Upgrade Advisor:');
  });

  it('runs breaking-changes end to end across two persisted snapshots', async () => {
    const { runtimeV1, runtimeV2, clock } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();
    clock.advanceTo(LATER);
    await runtimeV2.ingestSnapshot.execute();
    const { io, stdout } = captureIo();

    const exitCode = await runCli(
      ['breaking-changes', '--component', LIB_COMPONENT.id, '--from', 'snapshot-1', '--to', 'snapshot-2'],
      io,
      () => runtimeV1,
    );

    expect(exitCode).toBe(1);
    expect(stdout.join('\n')).toContain('### Breaking Change Report:');
  });

  it('exits 2 with a usage message when breaking-changes is missing required options', async () => {
    const factory = await preIngestedRuntimeFactory();
    const { io, stderr } = captureIo();

    const exitCode = await runCli(['breaking-changes', '--component', LIB_COMPONENT.id], io, factory);

    expect(exitCode).toBe(2);
    expect(stderr.join('\n')).toContain('breaking-changes requires');
  });

  it('runs dashboard end to end', async () => {
    const { io, stdout } = captureIo();
    const exitCode = await runCli(['dashboard'], io, freshRuntimeFactory);
    expect(exitCode).toBe(0);
    expect(stdout.join('\n').startsWith('<!doctype html>')).toBe(true);
  });
});

describe('CliToolError', () => {
  it('is a real Error subclass usable with instanceof', () => {
    const error = new CliToolError('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('boom');
  });
});
