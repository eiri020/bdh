
import Package from "../../package.json";
import { Command } from 'commander';

import * as GherkinCmd from './gherkin';
import * as YamlCmd from './yaml';

export const createProgram = (): Command => {
  const program = new Command();

  program.name(Package.name);
  program.version(Package.version);
  program.description(Package.description);

  // program.parse(process.argv);

  GherkinCmd.initCommand(program);
  YamlCmd.initCommand(program);

  return program;
}
