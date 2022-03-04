import log = require('npmlog');
import * as YAML from 'yaml';

import { BdhStatus } from "../types";

export class Step {
  public step: any;
  public major: string;
  public text: string;
  public keyword: string;

  // constructor(major: string, key: string, value: string, dependencies: Step[] = []) {
  //   this.major = major.toLowerCase().trim();
  //   this.key = key.trim();
  //   this.value = value.trim();
  //   this.dependencies = dependencies;
  // }


  public get isOutline() {
    const outlines = [...(this.text.matchAll(/<([^>]+)>/g))];
    return outlines.length > 0;
  }

  constructor(major: string, step: any) {
    this.major = major.toLowerCase().trim();
    this.step = step;
    this.keyword = step.keyword.trim();
    this.text = step.text.trim();
  }

  resolveStep(example: any) {
    if(this.isOutline) {



      const re = new RegExp(column,'g');
      this.text = this.text.replace(re, value);
      this.wasOutline = true;
    } else {
      return this;
    }
  }


}


export class BaseTranslator {

  protected _prefix: string;
  protected _gherkin: any;
  protected _status:  BdhStatus;
  protected _lines: string[] = [];
  
  public get lines() {
    return this._lines;
  }

  public get source() {
    return this._lines.join("\n");
  }

  public get yaml() {
    return YAML.parse(this.source);
  }

  constructor(prefix: string, gherkin: any) {
    this._prefix = prefix;
    this._gherkin = gherkin;
    this._status = new BdhStatus();
    this._status.addFile();
  }

  translateFeature(feature: any) {
    console.log(`Feature ${feature.name}`);
  }

  translateScenario(scenario: any) {
    console.log(`  Scenario: ${scenario.name}`);
  }

  translateGiven(scenario: any, step: any) {
    console.log(`    - condition: ${step.keyword.trim()} ${step.text.trim()}`);

    // if(first) {
    //   this._lines.push('  condition:')
    // }

    // this._lines.push(`    - alias: |-`);
    // this._lines.push(`        ${step.keyword.trim()} ${step.text.trim()}`)
    // this._lines.push('      # ADD HERE YOUR INITIAL STATE');
    // this._lines.push(`      condition: template`);
    // this._lines.push('      value_template: "{{ true == false }}"')
  }

  translateWhen(scenario: any, step: any) {
    console.log(`    - trigger: ${step.keyword.trim()} ${step.text.trim()}`);
    // if(first) {
    //   this._lines.push('  trigger:');
    // }

    // const outline = step.text.match(/<([^>]+)>/);
  
    // if(outline) {
    //   if(!scenario.examples || !Array.isArray(scenario.examples)) {
    //     throw new Error(`Examples ${outline[1]} for outline expected`)
    //   }
  
    //   const example = scenario.examples.find(example => 
    //       example?.tableHeader?.cells?.length && 
    //       example.tableHeader.cells.find(cell => cell.value === outline[1])
    //   );
  
    //   if(example) {
    //     let cellIdx = 0;
    //     for(; cellIdx < example.tableHeader.cells.length; cellIdx++) {
    //       if(example.tableHeader.cells[cellIdx].value === outline[1]) {
    //         break;
    //       }
    //     }
  
    //     // Todo patch full outline
    //     example.tableBody.forEach(row => {
    //       this._lines.push(`    # ${row.cells[cellIdx].value}`);
    //       this._lines.push('    # ADD HERE YOUR TRIGGER');
    //       this._lines.push(`    - platform: template`);
    //       this._lines.push('      value_template: "{{ true == false }}"');
    //     })
    //   }
    // }
    // else {  
    //   this._lines.push(`    # ${step.keyword.trim()} ${step.text.trim()}`);
    //   this._lines.push('    # ADD HERE YOUR TRIGGER');
    //   this._lines.push(`    - platform: template`);
    //   this._lines.push('      value_template: "{{ true == false }}"');
    // }
  }

  translateThen(scenario: any, step: any) {
    console.log(`    - action: ${step.keyword.trim()} ${step.text.trim()}`);
    // if(first) {
    //   this._lines.push('  action:');
    // }
    // this._lines.push(`    - alias: |-`);
    // this._lines.push(`        ${step.keyword.trim()} ${step.text.trim()}`);
    // this._lines.push('      # ADD HERE ACTION');
    // this._lines.push(`      service: persistent_notification.create`);
    // this._lines.push('      data: ');
    // this._lines.push(`        message: |-`);
    // this._lines.push(`          ${step.keyword.trim()}: ${step.text.trim()}`);
  }

  getExampleTable(scenario: any, columnName: string) {
    if(!scenario.examples || !Array.isArray(scenario.examples)) {
      throw new Error(`No scenarios table found in scenario "${scenario.name}"`);
    }

    const example = scenario.examples.find(example => 
      example?.tableHeader?.cells?.length && 
      example.tableHeader.cells.find(cell => cell.value === columnName)
    );

    if(!example) {
      throw new Error(`Cannot find column "${columnName}"`);
    }

    return example;
  }
/*
  translateOutline(scenario: any, step: any, translateMethod: (scenario: any, step: any) => void) {
    
    // const outlines = step.text.match(/<([^>]+)>/g);
    const outlines = [...(step.text.matchAll(/<([^>]+)>/g))];
  
    if(outlines.length > 0) {

      const example = this.getExampleTable(scenario, outlines[0][1]);
      

      example.tableBody.forEach(row => {

        let stepText = step.text.trim();

        outlines.forEach(outline => {
          const cellIdx = example.tableHeader.cells.findIndex(cell => cell.value === outline[1]);

          if(cellIdx < 0) {
            this._status.addError();
            log.error(this._prefix,`Outline key "${outline[1]} not found`);
            return;
          }
    
          stepText = stepText.replaceAll(`<${outlines[1]}>`, row.cells[cellIdx].value);
        });
        translateMethod.call(this, scenario, step);
      });
    } else {
      translateMethod.call(this, scenario, step);
    }
  }


  processOutline(scenario: any, outlineSteps: Step[]) {

    outlineSteps.forEach(outline => {
                            
      const outlines = [...outline.value.matchAll(/<([^>]+)>/g)];
  

      if(outlines.length > 0) {
        let example;
      
        try {
          example = this.getExampleTable(scenario, outlines[0][1]);
        } catch(err) {
          this._status.addError();
          log.error(this._prefix,err.message);
          return;
        }
        // For now values from multiple tables are not supported
        example.tableBody.forEach(row => {

          let stepText = outline.value.trim();
  
          outlines.forEach(outline => {
            const cellIdx = example.tableHeader.cells.findIndex(cell => cell.value === outline[1]);
  
            if(cellIdx < 0) {
              this._status.addError();
              log.error(this._prefix,`Outline key "${outline[1]} not found`);
              return;
            }
      
            stepText = stepText.replaceAll(`<${outline[1]}>`, row.cells[cellIdx].value);
          });
        });
      }

    })

  }
*/
  finalizeScenario(scenario: any, gotGiven: boolean, gotWhen: boolean, gotThen: boolean, outlineSteps: Step[]) {

  }

  translate(scenario?: string) {
    this._status.reset();
    this._status.addFile();
    this._lines = [];

    try {
      
      if(!this._gherkin.feature) {
        throw new Error(`No feature found`);
      }

      log.info(this._prefix,`Translating feature "${this._gherkin.feature.name}"`);

      if(!Array.isArray(this._gherkin.feature?.children) || !this._gherkin.feature.children.length) {
        throw new Error(`No scenarios found in feature ${this._gherkin.feature.name}`);
      }

      if(!scenario) {
        this.translateFeature(this._gherkin.feature);
      }

      this._gherkin.feature.children.forEach(element => {
 
        if(element.scenario && (!scenario || scenario === element.scenario.name)) {

          log.info(this._prefix,`Translating scenario "${element.scenario.name}"`);
          this._status.addScenario();

          let gotGiven = false;
          let gotWhen = false;
          let gotThen = false;
          const outlineSteps: Step[] = [];

          let major;

          try {
            if(!element.scenario.steps?.length) {
              throw new Error(`No steps found in scenario ${element.scenario.name}`);
            }

            this.translateScenario(element.scenario);
                
            element.scenario.steps.forEach(step => {

              const keyword = step.keyword.toLowerCase().trim();

              if(['given','when','then'].indexOf(keyword) >= 0&& major !== keyword) {
                major = keyword;
              }

              if(major &&  ['given','then','when','and','but','*'].indexOf(keyword) >= 0) {

                const outlines = [...(step.text.matchAll(/<([^>]+)>/g))];
  
                if(outlines.length > 0) {
                  outlineSteps.push(new Step(major, step));
                }            

                switch(major) {
                  case 'given':
                    gotGiven = true;
                    this.translateGiven(element.scenario,step);
                    break;
                  
                  case 'when':
                    gotWhen = true;
                    this.translateWhen(element.scenario,step);
                    break;
      
                  case 'then':
                    gotThen = true;
                    this.translateThen(element.scenario,step);
                    break;
                } 
              }
            });

            // this.processOutline(outlineSteps);
            this.finalizeScenario(element.scenario,gotGiven,gotWhen,gotThen, outlineSteps);

          } catch(err) {
            log.error(this._prefix,err.message);
            this._status.addError();
          }
        }
      });
 
      if(scenario && this._status.numScenarios === 0) {
        throw new Error(`Scenario "${scenario}" not found`);
      }
  
    } catch(err) {
      log.error(this._prefix,err.message);
      this._status.addError();
    }


    if(this._status.numErrors) {
      this._status.addFileError();
    }

    return this._status;
  }
}