import { strict as assert } from 'assert';
import { BaseTranslator, Step  } from "./base-translator";


class Automation {
  public scenario: any;
  public conditions: Step[] = [];
  public triggers: Step[] = [];
  public actions: Step[] = [];

  constructor(scenario: any) {
    this.scenario = scenario;
  }
}

export class AutomationTranslator extends BaseTranslator {
  public featureName: string;
  public currentAutomation: Automation; 

  translateFeature(feature: any) {
    this.featureName = feature.name;
    // this._lines.push('#############################################################');
    // this._lines.push(`# Feature: ${feature.name}`);
    // this._lines.push('#############################################################');    
  }

  translateScenario(scenario: any) {
    this.currentAutomation = new Automation(scenario);
    // this._lines.push('########################################');
    // this._lines.push(`# Scenario ${scenario.name}`);
    // this._lines.push('########################################');
    // this._lines.push(`- alias: |-`);
    // this._lines.push(`    Scenario ${this._prefix}: ${scenario.name}`);
    // this._lines.push(`  id: scenario_${this._prefix.replace(/[^\w]/g,'_')}_${scenario.name.toLowerCase().replace(/[^\w]/g,'_')}`)
  }

  translateGiven(scenario: any, step: any) {

    assert(this.currentAutomation,'currentAutomation Can not be null');

    this.currentAutomation.conditions.push(new Step('given', step.keyword, step.text));

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

    assert(this.currentAutomation,'currentAutomation Can not be null');

    if(step.keyword.toLowerCase().trim() === 'when') {
      this.currentAutomation.triggers.push(new Step('when', step));
    } else {
      this.currentAutomation.conditions.push(new Step('when', step));
    }
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

    assert(this.currentAutomation,'currentAutomation Can not be null');

    this.currentAutomation.conditions.push(new Step('then', step));
  }

  finalizeScenario(scenario: any, gotGiven: boolean, gotWhen: boolean, gotThen: boolean, outlineSteps: Step[]): void {
    assert(this.currentAutomation,'currentAutomation Can not be null');
      
    if(!gotWhen) {
      throw new Error (`Missing When steps in scenario "${scenario.name}"`);
    }
    if(!gotThen) {
      throw new Error(`Missing When steps in scenario "${scenario.name}"`);
    }
    
    this.currentAutomation.conditions.forEach(condition => {
      const outlines = [...(condition.text.matchAll(/<([^>]+)>/g))];

    })
  }
}