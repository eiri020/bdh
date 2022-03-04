import log = require('npmlog');

import { Command } from 'commander';
import { loadGherkin } from '../loaders/gherkin';
import { dumper } from './dumper';

export const initCommand = (program: Command) => {
  program
    .command('gherkin')
    .argument('<files...>')
    .option('-l, --loglevel <level>', 'set log level', 'info')
    .action((files: string[], options: any) => {

      const status = dumper(files,options,loadGherkin);

      log.log(status.numFileErrors > 0 ? 'error' : 'info','bdh',`${status.numFiles} files processed, ${status.numFileErrors} errors`);

      if(status.numFileErrors > 0) {
        program.error(`${status.numFileErrors} errors occured`,{ exitCode: 1 });
      }

    });

}
