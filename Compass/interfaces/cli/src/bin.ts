#!/usr/bin/env node
import { createCompassRuntime } from './composition-root.js';
import { runCli, stdIo } from './cli.js';

const exitCode = await runCli(process.argv.slice(2), stdIo, createCompassRuntime);
process.exitCode = exitCode;
