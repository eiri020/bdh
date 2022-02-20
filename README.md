# Behavior Driven Home (BDH)

This (typescript) script will allow you to define and test your automations using the [Gherkin](https://cucumber.io/docs/gherkin/reference/) language used in [Behavior Driven Development (BDD)](https://en.wikipedia.org/wiki/Behavior-driven_development).

You can find the latest code at github:
https://github.com/eiri020/bdh/tree/main

One of the great aspects of BDD is that you start with a natural language, Gherkin, to describe the behavior in scenarios you need support prior to developing code. This allows you to describe your scenario, without thinking of implementations or technical details. Also it creates boilerplate code to implement (unit) testing the scenario after implementation. 
In this project I use this same strategy to document behavior and start automating without code. When it is clear in your mind, and described it in Gherkin, you can fill in the Home Assistant or your installation specific details with sensors, triggers, actions and conditions. 
And this is exactly what this project aims for, start with describing behavior, then continue with coding and testing. 

Within Home Assistant (HA), your automations will grow in time, and automations created in the HA automation editor or manually in YAML will get harder to maintain and troubleshoot. This script tries to solve this a bit, by having all your automations described in a human language and being the source for changes in your automations. Also it can generate some tests scripts, that you need to implement to test your behavior after you created the automation scenarios.


- [Behavior Driven Home (BDH)](#behavior-driven-home-bdh)
- [Home Assitant automations vs. Gherkin scenarios](#home-assitant-automations-vs-gherkin-scenarios)
- [Feature files](#feature-files)
- [Workflow](#workflow)
- [Installation](#installation)
  - [Requirements](#requirements)
- [Generating automations and test scripts](#generating-automations-and-test-scripts)
  - [Creating automations](#creating-automations)
  - [Creating test scripts](#creating-test-scripts)
  - [Output options](#output-options)
  - [Output](#output)
    - [Automation](#automation)
      - [Features files to automation files](#features-files-to-automation-files)
      - [Scenarios to automations](#scenarios-to-automations)
      - [Given to condition](#given-to-condition)
      - [When to trigger](#when-to-trigger)
      - [Then to action](#then-to-action)
    - [Test scripts](#test-scripts)
      - [Features files to test scripts](#features-files-to-test-scripts)
- [Roadmap](#roadmap)
  - [Refactor code](#refactor-code)
  - [Mature options](#mature-options)
  - [Scenario Outline](#scenario-outline)
  - [Blueprint editor](#blueprint-editor)
  - [Enhanced test support](#enhanced-test-support)

# Home Assitant automations vs. Gherkin scenarios
When you take a look at this [Understanding Automations](https://www.home-assistant.io/docs/automation/basics/) page and look at the sample automation:

> *(trigger)*    When Paulus arrives home<br>
> *(condition)*  and it is after sunset<br>
> *(action)*     Turn the lights on in the living room

You may rephrase this, Gherkin like, as:

> *(condition)*  Given it is after sunset<br>
> *(trigger)*    When Paulus arrives home<br>
> *(action)*     Then turn the lights on in the living room

Luckely YAML allows you to change the order of nodes, so this Gherkin like implementation you can use almost out-of-the-box, but to start with this Gherkin language we need a translation step between the Gherkin language and the automation code you write.

# Feature files

I prefer to have my features described separatly from the YAML code, and have my automations described in thes files:

```gherkin
Feature: Bathroom features

  Scenario: House precense state changed
    When the house precense state changes
    Then make sure all electricity plugs are switched on 
    And when this state is not present then switch of table lights

  Scenario: You enter the bathroom
    When there is movement in the bathroom
    Then switch on the bathroom lights

  Scenario: You leave the bathroom
    When there is movement in the bathroom for 5 minutes
    Then switch on the bathroom lights
```

Searching, Changing, troubleshooting often starts with looking at the gherkin code. From there you can take a look at the implementstion code or testing scripts.

# Workflow

This BDH uses the following workflow to create and maintain Home Assistant automations:

  1. Create or change .feature files describing the automation scenarios in Gherkin language
  2. Compare and create the automation from the scenarios in the .feature files
  3. Implement the automations with your specific sensors and actions to perform 
  4. Compare and create the test scripts from the scenarios in the .feature files

# Installation

## Requirements

* A valid [node.js](https://nodejs.org/en/) and npm installation on your system. There numerous options on internet to do so.
* Typescript installed globally advised
* ts-node, globally advised

To install bdh, clone the repository into a directory

```bash
  git clone git@github.com:eiri020/bdh.git
```

Change to that directory and initialize the node modules

```bash
  cd bdh
  npm install
```
Transpile the typescript files to node.js

```bash
  tsc
```

# Generating automations and test scripts

The bdh script can create and compare automations and test scripts from your feature files. It detects when features, scenerios or steps within a scenario are changed and can create your automation files.

The script only creates automation or scripts (with the --generate option) if these don't exists, else it will dump the changed code to the console (with the --sample option), and you need to copy and paste this code into your scripts. 

The generated code can be loaded directly in Home Assistant, using the following additions in the configuration.yaml of your HA installation:

```yaml
automation ui: !include automations.yaml
automation bdh: !include_dir_merge_list bdh/packages/
script ui: !include scripts.yaml
script bdh: !include_dir_merge_named bdh/test/
```

This allows to use both the HA builtin automation and script editor and loading the created automations from separate files. 



## Creating automations

```bash
./bdh automation [--generate] [--sample] --output=bdh/packages <files...>
```

This will create the automations in folder bdh/package, replacing the .feature extension to .yaml.
When a file is a directory, it recurse through that directory, looking for all .feature files or sub directories. It will maintain the directory tree in the automation output.

## Creating test scripts

```bash
./bdh script [--generate] [--sample] --output=bdh/test <files...>
```

This will create the scripts in folder bdh/test, replacing the .feature extension to .yaml.
When a file is a directory, it recurse through that directory, looking for all .feature files or sub directories. It will maintain the directory tree in the script output.

## Output options

**-g, --generate**<br> 
Generate automation file if it does not exists

**-s, --sample**<br>
Dump changed automations, when the feature differs from the automation.

## Output
As a sample we create the following feature file: bdh/features/arriving.feature
```gherkin
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
```
### Automation
#### Features files to automation files
When you run bdh the first time:

```bash
./bdh automation --verbose --output=bdh/packages bdh/features
```

It will tell that a destination automation file bdh/packages/arriving.yaml does not exist. Adding the --generate option will create the missing feature implementation file. the file contents looks like:

```yaml
########################################
# Feature: Arriving and leaving home
########################################
########################################
# SCENARIO Arriving home after sunset
########################################
- alias: |-
    Scenario arriving: Arriving home after sunset
  id: scenario_arriving_arriving_home_after_sunset
  # GIVEN
  condition:
    - alias: |-
        Given it is after sunset
      # ADD HERE YOUR INITIAL STATE
      condition: template
      value_template: "{{ true == false }}"

  # WHEN
  trigger:
    # When Paulus arrives home
    # ADD HERE YOUR TRIGGER
    - platform: template
      value_template: "{{ true == false }}"

  # THEN
  action:
    - alias: |-
        Then turn the lights on in the living room
      # ADD HERE ACTION
      service: persistent_notification.create
      data: 
        message: |-
          Then: turn the lights on in the living room

    - alias: |-
        And switch on the television
      # ADD HERE ACTION
      service: persistent_notification.create
      data: 
        message: |-
          And: switch on the television


########################################
# SCENARIO Leaving home
########################################
- alias: |-
    Scenario arriving: Leaving home
  id: scenario_arriving_leaving_home
  # WHEN
  trigger:
    # When Paulus leaves home
    # ADD HERE YOUR TRIGGER
    - platform: template
      value_template: "{{ true == false }}"

  # THEN
  action:
    - alias: |-
        Then turn the lights off in the living room
      # ADD HERE ACTION
      service: persistent_notification.create
      data: 
        message: |-
          Then: turn the lights off in the living room

    - alias: |-
        And switch off the television
      # ADD HERE ACTION
      service: persistent_notification.create
      data: 
        message: |-
          And: switch off the television

```
#### Scenarios to automations
All scenarios in the feature file are converted to automations, starting with the alias having the name 
of the scenario: 

```yaml
########################################
# SCENARIO Arriving home after sunset
########################################
- alias: |-
    Scenario arriving: Arriving home after sunset
  id: scenario_arriving_arriving_home_after_sunset
```

I don't understand why HA does not use the id, for creating the automation entity_id. In stead it uses the alias, 
and to ensure them being unique among different features, the base name of the feature file is added to the scenario.

It is important to keep both alias and id untouched, so consequtive runs, can compare between feature and automation. You
can however add extra attributes to the automation itself, like [script mode](https://www.home-assistant.io/integrations/script/#script-modes) or any other options

#### Given to condition

The given part (initial state) is optional, as with the Scenario "Leaving home", else it will generate the following yaml condition code:

```yaml
  # GIVEN
  condition:
    - alias: |-
        Given it is after sunset
      # ADD HERE YOUR INITIAL STATE
      condition: template
      value_template: "{{ true == false }}"
```

After you have create your implementation, you code might look like:

```yaml
  # GIVEN
  condition:
    - alias: |-
        Given it is after sunset
      condition: "{{ is_state('sun.sun','below_horizon') }}"
```

Although it is recommended to change your feature, you may add additional conditions in your automation, 
as long when the alias does not start with a Gherkin keyword.


#### When to trigger

The triggers in HA do not support aliases, so there is no good way to map triggers in your automation with the 
when steps in your feature. The compare function, will therefore only notify if the number of triggers dont match 
the number of whens in the feature file.

It will generate the following yaml trigger code:
```yaml
  # WHEN
  trigger:
    # When Paulus arrives home
    # ADD HERE YOUR TRIGGER
    - platform: template
      value_template: "{{ true == false }}"
```

Your automation implementation might look like:

```yaml
  # WHEN
  trigger:
    # When Paulus arrives home
    - platform: state
      entity_id: person.mad_max
      from: not_home
      to: home
```

Adding more steps in the when section, will result in multiple possible triggers. Another way to accomplish this
is using Scenario Outlines. Using outlines will also generate a trigger for each example in the scenario outline. 
Currently there is only support for the Scenario Outline in the When/Trigger part. See the discussion about Scenario
Outline below.

An example, two scenarios with equal result, but the second one more accurate in the definition, telling what an
away state can be, and avoid having a choose construct in your action section:

```gherkin
Feature: Scenario Outline example

  Scenario: Switch off lights and plugs when nobody is home or sleeping
    When the house precense state changes
    Then make sure all electricity plugs are switched off 
    And when this state is not present then switch of table lights

  Scenario Outline: Outline Switch off lights and plugs when nobody is home or sleeping 
    When the house precense state changes to <precense state>
    Then make sure all electricity plugs are switched off 
    And switch off table lights

  Scenarios:
    | precense state |
    | shopping       |
    | daily          |
    | trip           |
    | sleeping       |
```
As you can see, with the second example the condition in the then 'when the state is not present' has been
moved to the When.

Your implementation may look like for both:

```yaml
########################################
# Feature: Scenario Outline example
########################################
########################################
# SCENARIO Switch off lights and plugs when nobody is home or sleeping
########################################
- alias: |-
    Scenario outline: Switch off lights and plugs when nobody is home or sleeping
  id: scenario_outline_switch_off_lights_and_plugs_when_nobody_is_home_or_sleeping
  # WHEN
  trigger:
    # When the house precense state changes
    - platform: event
      event_type: precense_state_changed

  # THEN
  action:
    - alias: |-
        Then make sure all electricity plugs are switched off
      service: homeassistant.turn_off
      data: 
        entity_id:
          - switch.table_socket_1
          - switch.table_socket_2

    - alias: |-
        And when this state is not present then switch off table lights
     choose:
        - conditions: "{{ trigger.event.data.state in ['shopping','daily','trip','sleeping'] }}"
          sequence:
            - service: script.tafel_lights_off


########################################
# SCENARIO Outline Switch off lights and plugs when nobody is home or sleeping
########################################
- alias: |-
    Scenario outline: Outline Switch off lights and plugs when nobody is home or sleeping
  id: scenario_outline_outline_switch_off_lights_and_plugs_when_nobody_is_home_or_sleeping
  # WHEN
  trigger:
    # shopping
    - platform: event
      event_type: precense_state_changed
      event_data:
        state: shopping
    # daily
    - platform: event
      event_type: precense_state_changed
      event_data:
        state: daily
    # trip
    - platform: event
      event_type: precense_state_changed
      event_data:
        state: trip
    # sleeping
    - platform: event
      event_type: precense_state_changed
      event_data:
        state: sleeping

  # THEN
  action:
    - alias: |-
        Then make sure all electricity plugs are switched off
      service: homeassistant.turn_off
      data: 
        entity_id:
          - switch.table_socket_1
          - switch.table_socket_2

    - alias: |-
        And when this state is not present then switch off table lights
      service: script.tafel_lights_off

```

#### Then to action
The then section in Gherkin will generate the action section in the automation. Above feature file will generate 
following automation yaml:

```yaml
  # THEN
  action:
    - alias: |-
        Then turn the lights on in the living room
      # ADD HERE ACTION
      service: persistent_notification.create
      data: 
        message: |-
          Then: turn the lights on in the living room

    - alias: |-
        And switch on the television
      # ADD HERE ACTION
      service: persistent_notification.create
      data: 
        message: |-
          And: switch on the television
```

And the final implementation may look like:

```yaml
  # THEN
  action:
    - alias: |-
        Then turn the lights on in the living room
      service: light.turn_on
      target:
        entity_id: light.living_room

    - alias: |-
        And switch on the television
      service: switch.turn_on
      target:
        entity_id: switch.tv
```

Note: it is allowed to add extra actions, for example to add delays, as long as the alias does not start with a 
Gherking keyword (including '*')

### Test scripts

One of the benefits of writing the Gherkin scenarios, is that they can be automatically converted to test scenarios.
Testing Home Automation is challenging because of its event driven nature and most of the times you can fake the sensors.

In a development world, we use 'mocking' during testing, which replaces the actual external dependency with a fake implementation, that exposes expected results. 

For Home Assistant sensor values used in the Given or When section it may be impossible to simulate that during testing. 
Therfore the trigger part of the automation will get fired by an automation.trigger service call, with default the script option to
skip the conditions.

Using trigger variables in your automation code will not work during testing, for example there is no from_state or to_state.

A lot of thinking need to be done, to have a good test implementation. For now we concentrate at just validating the
then section of the scenario.

#### Features files to test scripts
The same gherkin feature file can be used to generate your script

```bash
bdh script --generate --output=bdh/script bdh/feature
```


```yaml
########################################
# Feature: Arriving and leaving home
########################################
########################################
# SCENARIO Arriving home after sunset
########################################
scenario_arriving_arriving_home_after_sunset:
  alias: |-
    Scenario arriving: Arriving home after sunset
  sequence:
    # GIVEN
    - alias: |-
        Given it is after sunset
      # ADD HERE YOUR INITIAL STATE
      service: persistent_notification.create
      data: 
        message: |-
          Set state: it is after sunset

    # WHEN
    - alias: |-
        When Paulus arrives home
      service: automation.trigger
      target:
        entity_id: automation.scenario_arriving_arriving_home_after_sunset
      data:
        skip_condition: true

    # THEN
    - alias: |-
        Then turn the lights on in the living room
      choose:
        - conditions: 
          # ADD HERE YOUR VALIDATTION
          - condition: template
            value_template: "{{ true == false }}"
          sequence:
            - service: persistent_notification.create
              data_template:
                title: |-
                  Arriving home after sunset
                message: |-
                  SUCCESS: Then turn the lights on in the living room
      default:
        - service: persistent_notification.create
          data_template:
            title: |-
              Arriving home after sunset
            message: |-
              FAILED: Then turn the lights on in the living room

    - alias: |-
        And switch on the television
      choose:
        - conditions: 
          # ADD HERE YOUR VALIDATTION
          - condition: template
            value_template: "{{ true == false }}"
          sequence:
            - service: persistent_notification.create
              data_template:
                title: |-
                  Arriving home after sunset
                message: |-
                  SUCCESS: And switch on the television
      default:
        - service: persistent_notification.create
          data_template:
            title: |-
              Arriving home after sunset
            message: |-
              FAILED: And switch on the television

########################################
# SCENARIO Leaving home
########################################
scenario_arriving_leaving_home:
  alias: |-
    Scenario arriving: Leaving home
  sequence:
    # WHEN
    - alias: |-
        When Paulus leaves home
      service: automation.trigger
      target:
        entity_id: automation.scenario_arriving_leaving_home
      data:
        skip_condition: true

    # THEN
    - alias: |-
        Then turn the lights off in the living room
      choose:
        - conditions: 
          # ADD HERE YOUR VALIDATTION
          - condition: template
            value_template: "{{ true == false }}"
          sequence:
            - service: persistent_notification.create
              data_template:
                title: |-
                  Leaving home
                message: |-
                  SUCCESS: Then turn the lights off in the living room
      default:
        - service: persistent_notification.create
          data_template:
            title: |-
              Leaving home
            message: |-
              FAILED: Then turn the lights off in the living room

    - alias: |-
        And switch off the television
      choose:
        - conditions: 
          # ADD HERE YOUR VALIDATTION
          - condition: template
            value_template: "{{ true == false }}"
          sequence:
            - service: persistent_notification.create
              data_template:
                title: |-
                  Leaving home
                message: |-
                  SUCCESS: And switch off the television
      default:
        - service: persistent_notification.create
          data_template:
            title: |-
              Leaving home
            message: |-
              FAILED: And switch off the television
```
General in the given section, you put the state as required. you will notice that in this example, putting the sun below 
the horizon is a very hard thing to accomplish. Maybe you can run the test only in the evening ;)

# Roadmap

Here are some things I will be working on next, or need more investigation

## Refactor code
This code was written in a few days, from idea to result. Now it needs to convert from a quick and dirty solution 
to something that is maintainable, including unit tests. 

## Mature options
Options like supressing the current verbose output and dumping generated code to screen, will be done after the refacturing.

## Scenario Outline
The Gherkin Scenario Outline, may be usefull at a lot of places, like one initial (given state) will result in 
another end state (then). Supporting the multiple columns in Example tables will make this possible, but it might 
also result in having multiple automations for one scenario. Or maybe using blueprints for this purpose.

## Blueprint editor
When we would create automation blueprints, in stead of automations itself, you could use the blueprint automation
editor for adding the triggers and actions with Gherkin like prompts. But with the blueprint editor I don't think it 
is possible to add the conditions. More thinking to do for this.

## Enhanced test support
A lot of thinking to do for this


