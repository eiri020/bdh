
import * as fs from 'fs'
import * as YAML from 'yaml';


export const loadYaml = (yamlFile: string) => {
  let source;
  let yaml;

  try {
    source = fs.readFileSync(yamlFile,'utf8');
  } catch(err) {
    throw new Error(`Error loading file ${yamlFile}: ${err.message}`);
  }

  try {
    yaml = YAML.parse(source);
  } catch(err) {
    throw new Error(`Error parsing yaml file ${yamlFile}: ${err.message}`);
  }

  return yaml;
}