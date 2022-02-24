
import Gherkin = require('@cucumber/gherkin');
import Messages = require('@cucumber/messages');
import path = require('path');
import Diff = require('diff');

import * as fs from 'fs'
import log = require('npmlog');
import * as YAML from 'yaml';
import { program } from './src/cmds';

const gherkin_keywords =  ['given','when','then','and','but','*', 'scenario'];

interface FeatureStatus {
    numChangedFeatures: number;
    numErrors:          number;
}

const startsWithGherkin = (str: string): boolean => {
  return gherkin_keywords.indexOf(str.trim().split(/[^a-zA-Z*]/)[0].toLowerCase()) >= 0;
} 

const isScenarioAutomation = (str: string): boolean => {
  return str.trim().startsWith('scenario_');
} 

const getGherkingAliases = (container: any[]) => {
  return container.filter(step => step.alias && startsWithGherkin(step.alias)).map(obj => obj.alias.trim());
}

const getGherkingAutomationIds = (container: any[]) => {
  return container.filter(obj => obj.id && isScenarioAutomation(obj.id)).map(obj => obj.id.trim());
}

const getAutomationScenarios = (feature: any) => {
  if(!feature || !Array.isArray(feature)) {
    return [];
  }
  return feature.filter(obj => obj.id && obj.id.startsWith('scenario_'));
}


const getScriptScenarios = (feature: any) => {
  return Object.keys(feature).filter(key => key.startsWith('scenario_'));
}


const verbose = (str: string) => {
  const parsed = path.parse(path.resolve(process.argv[1]))
  console.log(`${parsed.name} - ${str}`);
}

const mkAutomationGiven = (feature: string, scenario: any, keyword: string, text: string, lines: string[]) => {
  lines.push(`    - alias: |-`);
  lines.push(`        ${keyword.trim()} ${text.trim()}`)
  lines.push('      # ADD HERE YOUR INITIAL STATE');
  lines.push(`      condition: template`);
  lines.push('      value_template: "{{ true == false }}"')
}

const mkScriptGiven = (feature: string, scenario: any, keyword: string, text: string, lines: string[]) => {
  lines.push(`    - alias: |-`);
  lines.push(`        ${keyword.trim()} ${text.trim()}`)
  lines.push('      # ADD HERE YOUR INITIAL STATE');
  lines.push(`      service: persistent_notification.create`);
  lines.push('      data: ');
  lines.push(`        message: |-`);
  lines.push(`          Set state: ${text.trim()}`);
}


const mkAutomationWhen = (feature: string, scenario: any, keyword: string, text: string, lines: string[]) => {
  const outline = text.match(/<([^>]+)>/);
  
  if(outline) {
    if(!scenario.examples || !Array.isArray(scenario.examples)) {
      throw new Error(`Examples ${outline[1]} for outline expected`)
    }

    const example = scenario.examples.find(example => 
        example?.tableHeader?.cells?.length && 
        example.tableHeader.cells.find(cell => cell.value === outline[1])
    );

    if(example) {
      let cellIdx = 0;
      for(; cellIdx < example.tableHeader.cells.length; cellIdx++) {
        if(example.tableHeader.cells[cellIdx].value === outline[1]) {
          break;
        }
      }

      example.tableBody.forEach(row => {
        lines.push(`    # ${row.cells[cellIdx].value}`);
        lines.push('    # ADD HERE YOUR TRIGGER');
        lines.push(`    - platform: template`);
        lines.push('      value_template: "{{ true == false }}"');
      })

    }
  }
  else {  
    lines.push(`    # ${keyword.trim()} ${text.trim()}`);
    lines.push('    # ADD HERE YOUR TRIGGER');
    lines.push(`    - platform: template`);
    lines.push('      value_template: "{{ true == false }}"');
  }
}


const mkScriptWhen = (feature: string, scenario: any, keyword: string, text: string, lines: string[]) => {
  lines.push(`    - alias: |-`);
  lines.push(`        ${keyword.trim()} ${text.trim()}`);
  lines.push(`      service: automation.trigger`);
  lines.push('      target:');
  lines.push(`        entity_id: automation.scenario_${feature}_${scenario.name.toLowerCase().replace(/[^\w]/g,'_')}`);
  lines.push('      data:');
  lines.push(`        skip_condition: true`);
}


const mkAutomationThen = (feature: string, scenario: any, keyword: string, text: string, lines: string[]) => {
  lines.push(`    - alias: |-`);
  lines.push(`        ${keyword.trim()} ${text.trim()}`);
  lines.push('      # ADD HERE ACTION');
  lines.push(`      service: persistent_notification.create`);
  lines.push('      data: ');
  lines.push(`        message: |-`);
  lines.push(`          ${keyword.trim()}: ${text.trim()}`);
}

const mkScriptThen = (feature: string, scenario: any, keyword: string, text: string, lines: string[]) => {
  lines.push(`    - alias: |-`);
  lines.push(`        ${keyword.trim()} ${text.trim()}`);
  lines.push(`      choose:`);
  lines.push('        - conditions: ');
  lines.push('          # ADD HERE YOUR VALIDATTION');
  lines.push('          - condition: template');
  lines.push('            value_template: "{{ true == false }}"');
  lines.push('          sequence:');
  lines.push('            - service: persistent_notification.create');
  lines.push('              data_template:');
  lines.push('                title: |-');
  lines.push(`                  ${scenario.name}`);
  lines.push('                message: |-');
  lines.push(`                  SUCCESS: ${keyword.trim()} ${text.trim()}`);
  lines.push('      default:');
  lines.push('        - service: persistent_notification.create');
  lines.push('          data_template:');
  lines.push('            title: |-');
  lines.push(`              ${scenario.name}`);
  lines.push('            message: |-');
  lines.push(`              FAILED: ${keyword.trim()} ${text.trim()}`);
}


const mkAutomation = (input: string, scenario?: any) => {

  const uuidFn = Messages.IdGenerator.uuid()
  const builder = new Gherkin.AstBuilder(uuidFn)
  const matcher = new Gherkin.GherkinClassicTokenMatcher() // or Gherkin.GherkinInMarkdownTokenMatcher()
  const parser = new Gherkin.Parser(builder, matcher);
  
  const parsed = path.parse(path.resolve(input));

  let gherkinDocument;
  try {
    const ins: string = fs.readFileSync(input,'utf8');
    gherkinDocument = parser.parse(ins);
  } catch(err) {
    throw new Error(`Cannot parse gherkin file ${input}: ${err.message}`)
  }
  let errorCount = 0;
  
  const lines: string[] = [];
  if(gherkinDocument?.feature) {
    
    if(!scenario) {
      lines.push('########################################');
      lines.push(`# Feature: ${gherkinDocument.feature.name}`);
      lines.push('########################################');
      // lines.push('automation:');
    }

    gherkinDocument.feature.children.forEach(element => {
      
      if(element.scenario && (!scenario || scenario.id == `scenario_${parsed.name}_${element.scenario.name.toLowerCase().replace(/[^\w]/g,'_')}`)) {

        lines.push('########################################');
        lines.push(`# SCENARIO ${element.scenario.name}`);
        lines.push('########################################');
        lines.push(`- alias: |-`);
        lines.push(`    Scenario ${parsed.name}: ${element.scenario.name}`);
        lines.push(`  id: scenario_${parsed.name.replace(/[^\w]/g,'_')}_${element.scenario.name.toLowerCase().replace(/[^\w]/g,'_')}`)

        let major;
        let foundWhen = false;
        let foundThen = false;
        element.scenario.steps.forEach(step => {
  
          const keyword = step.keyword.toLowerCase().trim();

          if(['given','when','then'].indexOf(keyword) >= 0) {
            if(major !== keyword) {
              lines.push(`  # ${keyword.toUpperCase()}`);
              major = keyword;
              switch(major) {
                case 'given':
                  lines.push('  condition:')
                  // given is optional
                  break;
                
                case 'when':
                  lines.push('  trigger:');
                  foundWhen = true;
                  break;

                case 'then':
                  lines.push('  action:');
                  foundThen = true;
                  break;
              }
            }
          }
          if(major && ['given','then','when','and','but','*'].indexOf(keyword) >= 0) {
            switch(major) {
              case 'given':
                mkAutomationGiven(parsed.name,element.scenario,step.keyword,step.text,lines);
                break;
              case 'when':
                mkAutomationWhen(parsed.name,element.scenario,step.keyword,step.text,lines);
                break;
              case 'then':
                mkAutomationThen(parsed.name,element.scenario,step.keyword,step.text,lines);
                break;
            }
          }

          lines.push('');
        });
        if(!foundWhen)
        {
          verbose(`ERROR: ${parsed.base}: Missing When section in gherkin scenario ${element.scenario.name}`);
          errorCount++;
        }
        if(!foundThen)
        {
          verbose(`ERROR: ${parsed.base}: Missing Then section in gherkin scenario ${element.scenario.name}`);
          errorCount++;
        }
      }
    });
    if(errorCount > 0) {
      throw new Error(`${errorCount} errors found in ${input}`);
    }
      return lines.join("\n");
  } else {
    throw new Error(`No feature found in Gherkin file ${input}`);
  }
}


const mkScript = (input: string, scenarioName?: string) => {

  const uuidFn = Messages.IdGenerator.uuid()
  const builder = new Gherkin.AstBuilder(uuidFn)
  const matcher = new Gherkin.GherkinClassicTokenMatcher() // or Gherkin.GherkinInMarkdownTokenMatcher()
  const parser = new Gherkin.Parser(builder, matcher);
  
  const parsed = path.parse(path.resolve(input));

  let gherkinDocument;
  try {
    const ins: string = fs.readFileSync(input,'utf8');
    gherkinDocument = parser.parse(ins);
  } catch(err) {
    throw new Error(`Cannot parse gherkin file ${input}: ${err.message}`)
  }
  let errorCount = 0;
  
  const lines: string[] = [];
  if(gherkinDocument?.feature) {
    
    if(!scenarioName) {
      lines.push('########################################');
      lines.push(`# Feature: ${gherkinDocument.feature.name}`);
      lines.push('########################################');
      // lines.push('automation:');
    }

    gherkinDocument.feature.children.forEach(element => {
      
      if(element.scenario && (!scenarioName || scenarioName == `scenario_${parsed.name}_${element.scenario.name.toLowerCase().replace(/[^\w]/g,'_')}`)) {

        lines.push('########################################');
        lines.push(`# SCENARIO ${element.scenario.name}`);
        lines.push('########################################');
        lines.push(`scenario_${parsed.name.replace(/[^\w]/g,'_')}_${element.scenario.name.toLowerCase().replace(/[^\w]/g,'_')}:`)
        lines.push(`  alias: |-`);
        lines.push(`    Scenario ${parsed.name}: ${element.scenario.name}`);
        lines.push(`  sequence:`);

        let major;
        let foundWhen = false;
        let foundThen = false;
        element.scenario.steps.forEach(step => {
  
          const keyword = step.keyword.toLowerCase().trim();

          if(['given','when','then'].indexOf(keyword) >= 0) {
            if(major !== keyword) {
              lines.push(`    # ${keyword.toUpperCase()}`);
              major = keyword;
              switch(major) {
                case 'given':
                  // lines.push('  condition:')
                  // given is optional
                  break;
                
                case 'when':
                  // lines.push('  trigger:');
                  foundWhen = true;
                  break;

                case 'then':
                  // lines.push('  action:');
                  foundThen = true;
                  break;
              }
            }
          }
          if(major && ['given','then','when','and','but','*'].indexOf(keyword) >= 0) {
            switch(major) {
              case 'given':
                mkScriptGiven(parsed.name,element.scenario,step.keyword,step.text,lines);
                break;
              case 'when':
                mkScriptWhen(parsed.name,element.scenario,step.keyword,step.text,lines);
                break;
              case 'then':
                mkScriptThen(parsed.name,element.scenario,step.keyword,step.text,lines);
                break;
            }
          }

          lines.push('');
        });
        if(!foundWhen)
        {
          verbose(`ERROR: ${parsed.base}: Missing When section in gherkin scenario ${element.scenario.name}`);
          errorCount++;
        }
        if(!foundThen)
        {
          verbose(`ERROR: ${parsed.base}: Missing Then section in gherkin scenario ${element.scenario.name}`);
          errorCount++;
        }
      }
    });
    if(errorCount > 0) {
      throw new Error(`${errorCount} errors found in ${input}`);
    }
      return lines.join("\n");
  } else {
    throw new Error(`No feature found in Gherkin file ${input}`);
  }
}


const missingAliases = (newContainer: any, orgContainer: any) => {
  if(!newContainer) {
    return [];
  }
  
  if(newContainer && newContainer.length && !Array.isArray(orgContainer)) {
    return newContainer.map(obj => obj.alias);
  }
  
  const newAliases = getGherkingAliases(newContainer);
  const orgAliases = getGherkingAliases(orgContainer);

  return newAliases.filter(alias => orgAliases.indexOf(alias) < 0);
}

const missingScenarioIds = (newContainer: any, orgContainer: any) => {
  if(!newContainer) {
    return [];
  }
  
  if(newContainer && newContainer.length && !Array.isArray(orgContainer)) {
    return newContainer.map(obj => obj.id);
  }
  
  const newIds = getGherkingAutomationIds(newContainer);
  const orgIds = getGherkingAutomationIds(orgContainer);

  return newIds.filter(id => orgIds.indexOf(id) < 0);
}

const missingSteps = (feature: string, majorName: string, action: string,  srcMajor: any[], dstMajor: any[], message: string) => {

  const missing = missingAliases(srcMajor, dstMajor);

  if(missing.length > 0) {
    verbose(`${action.toUpperCase()}: ${feature}: ${majorName.toUpperCase()} - ${missing.length} ${message}:`);
    missing.forEach(condition => {
      console.error(`\t${condition}`);
    });
  }

  return missing.length;
}

const compareTriggers = (feature: string, newScenario: any, orgScenario: any) => {
  if(newScenario?.trigger?.length != orgScenario?.trigger?.length) {
    verbose(`CHANGED: ${feature}: WHEN - ${orgScenario.trigger.length} triggers in automation, but expected ${newScenario.trigger.length} from gherkin:`);
    return true;
  }

  return false;
}

const compareFeatureWithAutomation = (featureFile: string, yamlFile: string, options: any) => {

  const parsed = path.parse(path.resolve(featureFile));

  let automation;
  try {
    automation = mkAutomation(featureFile);
  } catch(err) {
    throw new Error(`Error loading feature file ${featureFile}: ${err.message}`);
  }

  verbose(`INFO: ${parsed.base}: Target automation file ${yamlFile} exists, comparing scenarios`);

  let newFeature: any;
  let orgFeature: any;

  try {
    verbose(`INFO: ${parsed.base}: Parsing generated automation...`);
    newFeature = YAML.parse(automation);
  } catch(err) {
    throw new Error(`Generating automation yaml: ${err.message}, cannot continue`);
  }

  try {
    const org: string = fs.readFileSync(yamlFile,'utf8');
    verbose(`INFO: ${parsed.base}: Parsing target automation ${yamlFile}...`);

    orgFeature = YAML.parse(org);
  } catch(err) {
    throw new Error(`Error parsng target automation: ${err.message}, cannot continue`);
  }

  return compareFeatureAutomation(parsed.base, newFeature, orgFeature, featureFile, options.sample) > 0;
}

const compareFeatureWithScript = (featureFile: string, yamlFile: string, options: any) => {

  const parsed = path.parse(path.resolve(featureFile));

  let automation;
  try {
    automation = mkScript(featureFile);
  } catch(err) {
    throw new Error(`Error loading feature file ${featureFile}: ${err.message}`);
  }

  verbose(`INFO: ${parsed.base}: Target script file ${yamlFile} exists, comparing scenarios`);

  let newFeature: any;
  let orgFeature: any;

  try {
    verbose(`INFO: ${parsed.base}: Parsing generated script...`);
    newFeature = YAML.parse(automation);
  } catch(err) {
    throw new Error(`Generating script yaml: ${err.message}, cannot continue`);
  }

  try {
    const org: string = fs.readFileSync(yamlFile,'utf8');
    verbose(`INFO: ${parsed.base}: Parsing target script ${yamlFile}...`);

    orgFeature = YAML.parse(org);
  } catch(err) {
    throw new Error(`Error parsng target script: ${err.message}, cannot continue`);
  }

  return compareFeatureScript(parsed.base, newFeature, orgFeature, featureFile, options.sample) > 0;
}

const compareFeatureAutomation = (feature: string, newFeature: any, orgFeature: any, gherkinFile: string, sample = false) => {

  const newScenarios = getAutomationScenarios(newFeature);
  const orgScenarios = getAutomationScenarios(orgFeature);

  verbose(`INFO: ${feature}: Comparing feature: expected ${newScenarios.length}, found ${orgScenarios.length} scenarios`);

  let numChangedScenarios = 0;
  
  for(const newScenario of newScenarios) {

    let createYaml = false

    const orgScenario = orgScenarios.find(scenario => scenario.id.trim() === newScenario.id.trim());

    if(!orgScenario) {
      verbose(`MISSING: ${feature} Missing scenario. Should be added`);
      verbose(`\t${newScenario.alias}`);

      createYaml = true;
    } else {
      verbose(`INFO: ${feature}: Comparing ${newScenario.alias}`);

      const missingGiven = missingSteps(feature, 'GIVEN', 'MISSING', newScenario?.condition, orgScenario?.condition, 'conditions missing in automation. should be added') > 0;
      const deletedGiven = missingSteps(feature, 'GIVEN', 'DELETED', orgScenario?.condition, newScenario?.condition, 'conditions not found in gherkin. should be removed') > 0;
      const missingThen  = missingSteps(feature, 'THEN', 'MISSING', newScenario?.action, orgScenario?.action, 'actions missing in automation. should be added') > 0;
      const deletedThen  = missingSteps(feature, 'THEN', 'DELETED', orgScenario?.action, newScenario?.action, 'actions not found in gherkin. should be removed') > 0;
      const changedTriggers = compareTriggers(feature, newScenario, orgScenario); 

      if(missingGiven || deletedGiven || missingThen || deletedThen || changedTriggers) {
        createYaml = true;
      }
    }

    if(createYaml) {
      numChangedScenarios++;
      if(sample) {
        verbose(`Generated Scenario automation:`);
        console.log(mkAutomation(gherkinFile, newScenario));
      }
    }

    verbose(`INFO: ${feature}: ${numChangedScenarios} changes in ${newScenario.alias}`);

  }

  // Check for deleted scenarios
  const deletedScenarios = missingScenarioIds(orgScenarios,newScenarios);

  numChangedScenarios += deletedScenarios.length;

  if(deletedScenarios.length > 0) {
    verbose(`DELETED: ${feature}: ${deletedScenarios.length} automations not found in gherkin. should be removed:`);
    deletedScenarios.forEach(scenario => {
      verbose(`\t${scenario}`);
    });
  }

  verbose(`INFO: ${feature}: ${numChangedScenarios} scenarios changed in feature`);

  return numChangedScenarios;
}

const compareFeatureScript = (feature: string, newFeature: any, orgFeature: any, gherkinFile: string, sample = false) => {

  const newScenarios = getScriptScenarios(newFeature);
  const orgScenarios = getScriptScenarios(orgFeature);

  verbose(`INFO: ${feature}: Comparing feature: expected ${newScenarios.length}, found ${orgScenarios.length} scenarios`);

  let numChangedScenarios = 0;
  
  for(const newScenarioName of newScenarios) {

    let createYaml = false

    // const orgScenarioName = orgScenarios.find(scenario => scenario === newScenarioName);

    const newScenario = newFeature[newScenarioName];
    const orgScenario = orgFeature[newScenarioName]

    if(!orgScenario) {
      verbose(`MISSING: ${feature} Missing scenario. Should be added`);
      verbose(`\t${newScenarioName}`);

      createYaml = true;
    } else {
      verbose(`INFO: ${feature}: Comparing ${newScenarioName}`);


      const changes = Diff.diffArrays(orgScenario.sequence,newScenario.sequence, { comparator: (left: any, right: any) => {
        return left.alias &&
               startsWithGherkin(left.alias) &&
               right.alias &&
               startsWithGherkin(right.alias) &&
               left.alias === right.alias;
      } });

      // console.log(JSON.stringify(changes));

      const addedSteps = changes.filter(change => change.added);

      if(addedSteps.length > 0) {
        createYaml = true;
        let addedCount = 0;
        addedSteps.forEach(change => { addedCount += change.count });
        verbose(`MISSING: following ${addedCount} steps are not avaiable in the script:`);
        addedSteps.forEach(change => change.value.forEach(step => {
          if(step.alias) {
            verbose(`\t${step.alias}`);
          }
        }));
      }
      
      const removedSteps = changes.filter(change => change.removed);

      let deletedCount = 0;
      removedSteps.forEach(change => change.value.forEach(step => {
        if(step.alias && startsWithGherkin(step.alias)) {
          deletedCount++;
        }
      })); 


      if(deletedCount > 0) {
        createYaml = true;
        // onjuiste telling, support voor extra handmatige stappen, zonder alias / gherkin trefword
          
        verbose(`DELETED: following ${deletedCount} steps are deleted from scenario:`);
        removedSteps.forEach(change => change.value.forEach(step => {
          if(step.alias  && startsWithGherkin(step.alias)) {
            verbose(`\t${step.alias}`);
          }
        }));
      }
      
    }

    if(createYaml) {
      numChangedScenarios++;
      if(sample) {
        verbose(`Generated Scenario automation:`);
        console.log(mkScript(gherkinFile, newScenarioName));
      }
    }

    verbose(`INFO: ${feature}: ${numChangedScenarios} changes in ${newScenario.alias}`);

  }



  // Check for deleted scenarios
  const deletedScenarios = orgScenarios.filter(oldScenario => newScenarios.find(newScenario => newScenario === oldScenario) == null); 

  numChangedScenarios += deletedScenarios.length;

  if(deletedScenarios.length > 0) {
    verbose(`DELETED: ${feature}: ${deletedScenarios.length} automations not found in gherkin. should be removed:`);
    deletedScenarios.forEach(scenario => {
      verbose(`\t${scenario}`);
    });
  }

  verbose(`INFO: ${feature}: ${numChangedScenarios} scenarios changed in feature`);

  return numChangedScenarios;
  
}


const generateAutomation = (featureFile: string, yamlFile: string, options: any) => {

  const parsed = path.parse(path.resolve(featureFile));

  let automation;
  try {
    automation = mkAutomation(featureFile);
  } catch(err) {
    throw new Error(`Skipping feature file ${featureFile}: ${err.message}`);
  }

  if(options.generate) {
    verbose(`INFO: ${parsed.base}: File ${yamlFile} does not exists. creating...`);
    try {
      fs.writeFileSync(yamlFile, automation);
    } catch(err) {
      throw new Error(`Error writing file ${yamlFile}: ${err.message}`)
    }
    verbose(`CREATED: ${parsed.base}: Automation file ${yamlFile} created. EDIT IMPLEMENTATION!`);
  } else {
    verbose(`MISSING: ${parsed.base}: Automation file ${yamlFile} does not exist! Use --generate option to create`);
  }

  if(options.sample) {
    console.log(automation);
  }
}


const generateScript = (featureFile: string, yamlFile: string, options: any) => {

  const parsed = path.parse(path.resolve(featureFile));

  let automation;
  try {
    automation = mkScript(featureFile);
  } catch(err) {
    throw new Error(`Skipping feature file ${featureFile}: ${err.message}`);
  }

  if(options.generate) {
    verbose(`INFO: ${parsed.base}: File ${yamlFile} does not exists. creating...`);
    try {
      fs.writeFileSync(yamlFile, automation);
    } catch(err) {
      throw new Error(`Error writing file ${yamlFile}: ${err.message}`)
    }
    verbose(`CREATED: ${parsed.base}: Script file ${yamlFile} created. EDIT IMPLEMENTATION!`);
  } else {
    verbose(`MISSING: ${parsed.base}: Script file ${yamlFile} does not exist! Use --generate option to create`);
  }

  if(options.sample) {
    console.log(automation);
  }
}



const feature2yaml = (featureFile: string, baseYamlPath: string, options: any): FeatureStatus => {

  const status: FeatureStatus = {
    numChangedFeatures: 0,
    numErrors: 0
  };

  if (options.generate && !fs.existsSync(baseYamlPath)){
    try {
      verbose(`CREATING: Output folder ${baseYamlPath} does not exists, creating...`);
      fs.mkdirSync(baseYamlPath, { recursive: true });
    } catch(err) {
      throw new Error(`Error creating output folder ${baseYamlPath}: ${err.message}`);
    }
  }

  if(fs.lstatSync(featureFile).isDirectory()) {
    
    fs.readdirSync(featureFile).filter(file => {
      const st = fs.lstatSync(`${featureFile}/${file}`);

      return (st.isDirectory() && ['.','..'].indexOf(file) < 0) || (!st.isDirectory() && file.endsWith('.feature'));

    }).forEach(file => {

      let result = {
        numChangedFeatures: 0,
        numErrors: 0
      }

      const subFeatureFile = `${featureFile}/${file}`; 


      if(fs.lstatSync(subFeatureFile).isDirectory()) {
        if(subFeatureFile != baseYamlPath) {
          result = feature2yaml(subFeatureFile, `${baseYamlPath}/${path.parse(path.resolve(file)).base}`, options);
        }
      } else { 
        result = feature2yaml(subFeatureFile, `${baseYamlPath}`, options);
      }

      status.numChangedFeatures += result.numChangedFeatures;
      status.numErrors += result.numErrors;
    });
  } else {
    const parsed = path.parse(path.resolve(featureFile));
    const yamlFile = `${baseYamlPath}/${parsed.name}.yaml`;

    verbose(`INFO: ${parsed.base}: Loading feature file`);

    try {

      // let automation;
      // try {
      //   automation = mkAutomation(featureFile);
      // } catch(err) {
      //   throw new Error(`Skipping feature file ${featureFile}: ${err.message}`);
      // }

      if(!fs.existsSync(yamlFile)) {
        generateAutomation(featureFile, yamlFile, options);
        status.numChangedFeatures++;
      } else if(compareFeatureWithAutomation(featureFile, yamlFile, options)) {
        status.numChangedFeatures++;
      }
    } catch(err) {
      verbose(`ERROR: ${parsed.base}: ${err.message}`);
      status.numErrors++;
    }
  }

  return status;
}


const feature2script = (featureFile: string, baseYamlPath: string, options: any): FeatureStatus => {

  const status: FeatureStatus = {
    numChangedFeatures: 0,
    numErrors: 0
  };

  if (options.generate && !fs.existsSync(baseYamlPath)){
    try {
      verbose(`CREATING: Output folder ${baseYamlPath} does not exists, creating...`);
      fs.mkdirSync(baseYamlPath, { recursive: true });
    } catch(err) {
      throw new Error(`Error creating output folder ${baseYamlPath}: ${err.message}`);
    }
  }

  if(fs.lstatSync(featureFile).isDirectory()) {
    
    fs.readdirSync(featureFile).filter(file => {
      const st = fs.lstatSync(`${featureFile}/${file}`);

      return (st.isDirectory() && ['.','..'].indexOf(file) < 0) || (!st.isDirectory() && file.endsWith('.feature'));

    }).forEach(file => {

      let result;

      const subFeatureFile = `${featureFile}/${file}`; 


      if(fs.lstatSync(subFeatureFile).isDirectory()) {
        result = feature2script(subFeatureFile, `${baseYamlPath}/${path.parse(path.resolve(file)).base}`, options);
      } else { 
        result = feature2script(subFeatureFile, `${baseYamlPath}`, options);
      }

      status.numChangedFeatures += result.numChangedFeatures;
      status.numErrors += result.numErrors;
    });
  } else {
    const parsed = path.parse(path.resolve(featureFile));
    const yamlFile = `${baseYamlPath}/${parsed.name}.yaml`;

    verbose(`INFO: ${parsed.base}: Loading feature file`);

    try {

      // let automation;
      // try {
      //   automation = mkScript(featureFile);
      // } catch(err) {
      //   throw new Error(`Skipping feature file ${featureFile}: ${err.message}`);
      // }

      if(!fs.existsSync(yamlFile)) {
        generateScript(featureFile, yamlFile, options);
        status.numChangedFeatures++;
      } else if(compareFeatureWithScript(featureFile, yamlFile, options)) {
        status.numChangedFeatures++;
      }
    } catch(err) {
      verbose(`ERROR: ${parsed.base}: ${err.message}`);
      status.numErrors++;
    }
  }

  return status;
}


const gherkinConverter = (files: string[], options: any, featureConverter: (featureFile: string, baseYamlPath: string, options: any) => FeatureStatus): FeatureStatus => {

  const output  = options.output.trim();
  const baseOutputPath = path.resolve(output);
  let baseGherkinPath = '.';

  if (options.generate && !fs.existsSync(baseOutputPath)){
    verbose(`INFO: Output folder ${baseOutputPath} does not exists, creating...`);
    fs.mkdirSync(baseOutputPath, { recursive: true });
  }

  let status:FeatureStatus = {
      numChangedFeatures: 0,
      numErrors: 0
    };

  if(files.length == 1 && fs.lstatSync(files[0]).isDirectory()) {
    baseGherkinPath = path.resolve(files[0]);

    status = featureConverter(baseGherkinPath, baseOutputPath, options);      
  } else {
    files.forEach(file => {

      const fullPath = `${baseGherkinPath}/${file}`;
      let result;

      if(fs.lstatSync(fullPath).isDirectory()) {
        if(baseOutputPath != fullPath) {
          result = featureConverter(fullPath, `${baseOutputPath}/${path.parse(path.resolve(fullPath)).base}`, options);
        }
      } else { 
        result = featureConverter(fullPath, `${baseOutputPath}`, options);
      }

      status.numChangedFeatures += result.numChangedFeatures;
      status.numErrors += result.numErrors;
    });

  }
  
  verbose(`INFO: ${status.numChangedFeatures} features changed`);

  // if(status.numErrors > 0) {
  //   verbose(`ERROR: ${status.numErrors} files with errors`);
  //   // process.exit(-1);
  // } else if(status.numChangedFeatures > 0) {
  //   verbose(`UPDATE: ${status.numErrors} files with changes`);
  //   // process.exit(1);
  // }
  return status;
}


program
  .command('automation-dump')
  .argument('<files...>')
  .action((files: string[]) => {
    files.forEach(file => {
      console.log(mkAutomation(file));
    });
  });




program
  .command('automation')
  .argument('<files...>')
  .option('-o, --output <output>', 'output folder', 'packages')
  .option('-g, --generate', 'generate automation yaml if not exists', false)
  .option('-t, --testscript <script>', 'generate test script yaml ')
  .option('-s, --sample', 'print changed automation template', false)
  // .option('-v, --verbose', 'verbose output')
  .action((files: string[], options: any) => {

    const status =  gherkinConverter(files, options, feature2yaml);

    if(status.numErrors > 0) {
      verbose(`ERROR: ${status.numErrors} files with errors`);
      process.exit(-1);
    } else if(status.numChangedFeatures > 0) {
      verbose(`UPDATE: ${status.numErrors} files with changes`);
      process.exit(1);
    }


    // let output  = options.output.trim();
    // let baseYamlPath = `${output.startsWith('/') ? '' : process.cwd()}/${output}`;
    // let baseGherkinPath = '.';

    // if (options.generate && !fs.existsSync(baseYamlPath)){
    //   verbose(`INFO: Output folder ${baseYamlPath} does not exists, creating...`);
    //   fs.mkdirSync(baseYamlPath, { recursive: true });
    // }

    // let status:FeatureStatus = {
    //     numChangedFeatures: 0,
    //     numErrors: 0
    //   };

    // if(files.length == 1 && fs.lstatSync(files[0]).isDirectory()) {
    //   baseGherkinPath = path.resolve(files[0]);

    //   status = feature2yaml(baseGherkinPath, baseYamlPath, options);      
    // } else {
    //   files.forEach(file => {

    //     const fullPath = `${baseGherkinPath}/${file}`;
    //     let result;
  
    //     if(fs.lstatSync(fullPath).isDirectory()) {
    //       result = feature2yaml(fullPath, `${baseYamlPath}/${path.parse(path.resolve(fullPath)).base}`, options);
    //     } else { 
    //       result = feature2yaml(fullPath, `${baseYamlPath}`, options);
    //     }
  
    //     status.numChangedFeatures += result.numChangedFeatures;
    //     status.numErrors += result.numErrors;
    //   });
  
    // }
    
    // verbose(`INFO: ${status.numChangedFeatures} features changed`);

    // if(status.numErrors > 0) {
    //   verbose(`ERROR: ${status.numErrors} files with errors`);
    //   process.exit(-1);
    // } else if(status.numChangedFeatures > 0) {
    //   verbose(`UPDATE: ${status.numErrors} files with changes`);
    //   process.exit(1);
    // }
  });


program
  .command('script')
  .argument('<files...>')
  .option('-o, --output <output>', 'output folder', 'test')
  .option('-g, --generate', 'generate automation yaml if not exists', false)
  .option('-s, --sample', 'print changed automation template', false)
  // .option('-v, --verbose', 'verbose output')
  .action((files: string[], options: any) => {

    const status =  gherkinConverter(files, options, feature2script);

    if(status.numErrors > 0) {
      verbose(`ERROR: ${status.numErrors} files with errors`);
      process.exit(-1);
    } else if(status.numChangedFeatures > 0) {
      verbose(`UPDATE: ${status.numErrors} files with changes`);
      process.exit(1);
    }
  });

  try {
    program.parse(process.argv);
  } catch(err) {
    log.error(path.resolve(process.argv[0]),`Error executing command: ${err.message}`);
    process.exit(-1);
  }
