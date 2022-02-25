
import path = require('path');
import log = require('npmlog');

import { Command } from 'commander';
import { Feature } from './feature';
import { BdhStatus } from './types';
import { loadYaml } from './yaml';

export const program = new Command();


program
  .command('gherkin')
  .argument('<files...>')
  .option('-l, --loglevel <level>', 'set log level', 'info')
  .action((files: string[], options: any) => {

    const status: BdhStatus = {
      numDeleted: 0,
      numErrors: 0,
      numFileErrors: 0,
      numFiles: 0,
      numMissing: 0,
      numScenarios: 0
    }

    log.level = options.loglevel;
    log.disableProgress();

    files.forEach(file => {
      status.numFiles++;
      log.info(path.parse(file).base,`reading feature ${file}`);
      try {
        const feature = new Feature(file);
        console.log(JSON.stringify(feature.gherkin,null,' '));
      } catch(err) {
        status.numFileErrors++;
        log.error(path.parse(file).base, err.message);
      }
    });

    log.info('bdh',`${status.numFiles} feature files`);
    if(status.numFileErrors > 0) {
      log.error('bdh',`${status.numFileErrors} errors`);
    } else {
      log.info('bdh', '0 errors');
    }
  });


program
  .command('yaml')
  .argument('<files...>')
  .option('-l, --loglevel <level>', 'set log level', 'info')
  .action((files: string[], options: any) => {

    const status: BdhStatus = {
      numDeleted: 0,
      numErrors: 0,
      numFileErrors: 0,
      numFiles: 0,
      numMissing: 0,
      numScenarios: 0
    }

    log.level = options.loglevel;
    log.disableProgress();

    files.forEach(file => {
      status.numFiles++;
      log.info(path.parse(file).base,`reading feature ${file}`);
      try {
        const yaml = loadYaml(file);
        console.log(JSON.stringify(yaml,null,' '));
      } catch(err) {
        status.numFileErrors++;
        log.error(path.parse(file).base, err.message);
      }
    });

    log.info('bdh',`${status.numFiles} feature files`);
    if(status.numFileErrors > 0) {
      log.error('bdh',`${status.numFileErrors} errors`);
    } else {
      log.info('bdh', '0 errors');
    }
  });

