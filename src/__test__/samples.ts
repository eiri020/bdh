import * as fs from 'fs';

export const loadFeatureFile = (file: string) => {
  return fs.readFileSync(`${__dirname}/${file}`,'utf8');
}

export const emptyFeature = `
Feature: Arriving and leaving home
`;

export const invalidFeature = `
Featur Arriving and leaving home

  Scenari Arriving home after sunset
    Given it is after sunset
    When Paulus arrives home
    Then turn the lights on in the living room
    And switch on the television
    When Paulus leaves home
    Then turn the lights off in the living room
    And switch off the television
`; 

export const validFeature = `
Feature: Arriving and leaving home

  Scenario: Arriving home after sunset
    Given it is after sunset
    When Paulus arrives home
    Then turn the lights on in the living room
    And switch on the television
    
  Scenario: Leaving home 
    When Paulus leaves home
    Then turn the lights off in the living room
    And switch off the television
`;

export const emptyScenario = `
Feature: Arriving and leaving home

  Scenario: Arriving home after sunset
    
  Scenario: Leaving home 
    When Paulus leaves home
    Then turn the lights off in the living room
    And switch off the television
`;

export const nogivenScenario = `
Feature: Arriving and leaving home

  Scenario: Arriving home after sunset
    When Paulus arrives home
    Then turn the lights on in the living room
    And switch on the television
    
  Scenario: Leaving home 
    When Paulus leaves home
    Then turn the lights off in the living room
    And switch off the television
`;

export const nowhenScenario = `
Feature: Arriving and leaving home

  Scenario: Arriving home after sunset
    Given it is after sunset
    Then turn the lights on in the living room
    And switch on the television
    
  Scenario: Leaving home 
    When Paulus leaves home
    Then turn the lights off in the living room
    And switch off the television
`;

export const nothenScenario = `
Feature: Arriving and leaving home

  Scenario: Arriving home after sunset
    Given it is after sunset
    When Paulus arrives home
  
  Scenario: Leaving home 
    When Paulus leaves home
    Then turn the lights off in the living room
    And switch off the television
`;

export const outlineValid = `
Feature: Arriving and leaving home

  Scenario Outline: Arriving home after sunset
    Given it is after sunset <given replace>
    When Paulus arrives home <when replace>
    Then turn the lights on in the living room <then replace>
    
    
    Scenarios:
      | given replace | when replace | then replace |
      | value given 1 | value when 1 | value then 1 |       
      | value given 2 | value when 2 | value then 2 |       

`;

export const validMarkdown = `
# Feature: Staying alive

This is about actually staying alive,
not the [Bee Gees song](https://www.youtube.com/watch?v=I_izvAbhExY).


## Scenario Outline: eating

* Given there are <start> cucumbers
* When I eat <eat> cucumbers
* Then I should have <left> cucumbers

### Examples:

  | start | eat | left |
  | ----- | --- | ---- |
  |    12 |   5 |    7 |
  |    20 |   5 |   15 |
`;

export const invalidYaml = `
should_not_load
  this:
  - tag
  - tag2    
`;

export const validYaml = `
should_load:
  this:
  - tag
  - tag2
`;

