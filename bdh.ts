#!/usr/bin/env ts-node
import * as Cmds from './src/cmds/cmds';

async function main(): Promise<void> {
  const program = Cmds.createProgram();
  program.parse(process.argv);
}

void main();