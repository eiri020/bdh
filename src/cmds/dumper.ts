import path = require('path');
import fs = require('fs');
import log = require('npmlog');

import { BdhStatus } from '../types';

export const dumper = (files: string[], options: any, loader: (file: string) => any, extension?: string) => {

  const status = new BdhStatus();

  log.level = options.loglevel;

  files.forEach(file => {

    if(['.','..'].indexOf(file) >= 0) {
      return;        
    }

    if(!fs.existsSync(file)) {
      status.addError();
      status.addFileError();
      log.error(path.parse(file).base,`Cannot file or folder ${file}`);
      return;
    }


    if(fs.lstatSync(file).isDirectory()) {

      if(extension) {
        const subfiles = fs.readdirSync(file, { withFileTypes: true }).filter(file => {
            return (file.isDirectory() && ['.','..'].indexOf(file.name) < 0) || (!file.isDirectory() && file.name.endsWith(extension));
          }).map(dirent => path.resolve(file,dirent.name));
  
        status.merge(dumper(subfiles,options,loader,extension));
      } else {
        status.addError();
        status.addFileError();
        log.error(path.parse(file).base,`Cannot walk through folder ${file} without extension to filter`);
      }
    } else {
      status.addFile();

      log.info(path.parse(file).base,`reading file ${file}`);
      
      try {
        const yaml = loader(file);
        console.log(JSON.stringify(yaml,null,' '));
      } catch(err) {
        status.addError();
        status.addFileError();
        log.error(path.parse(file).base, err.message);
      }
    }
  });

  return status;
}


