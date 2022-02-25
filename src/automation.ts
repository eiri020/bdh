import * as fs from 'fs'
import log = require('npmlog');
import path = require('path');
import * as YAML from 'yaml';

export class YamlTranslator {
  protected _yamlFile: string;
  protected _logPrefix: string;
  protected _yaml: any;

  public get yamlFile() {
    return this._yamlFile;
  }

  public get yaml() {
    return this._yaml;
  }

  protected constructor(yamlFile: string, yaml: any) {
    this._yamlFile = path.resolve(yamlFile);
    this._logPrefix = path.parse(this._yamlFile).name;
    this._yaml = yaml;
  }

  public static loadFromYaml(yamlFile: string) {
    const logPrefix = path.parse(yamlFile).name;
    
    let source;
    let yaml;

    try {
      log.info(logPrefix,`Loading target file ${yamlFile}...`);
      source = fs.readFileSync(yamlFile,'utf8');
    } catch(err) {
      log.error(logPrefix,`Error loading file ${yamlFile}: ${err.message}`);
      throw new Error(`Error loading file ${yamlFile}: ${err.message}`);
    }
  
    try {
      yaml = YAML.parse(source);
    } catch(err) {
      log.error(logPrefix,`Error parsing yaml file ${yamlFile}: ${err.message}`);
      throw new Error(`Error parsing yaml file ${yamlFile}: ${err.message}`);
    }
    return new YamlTranslator(yamlFile, yaml);
  }
}


// export class Automation {
//   private _automationFile: string;
//   private _logPrefix: string;

// }