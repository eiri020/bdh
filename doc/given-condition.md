# Given to condition

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

In Gherkin the Given steps are used to describe the initial context of the system - the scene of the scenario. It is typically something that happened in the past.

The Home Assistant counterpart 'condition' however, may also be used as condition during the when/trigger, specifically when you use the trigger variable in the condition section of your automation. As a convention you could use the words 'will be' or similar to
emphasis this state is only valid during the when/trigger.

An example of this is this HA automation

```yaml
  - id: kitchen_precense_state_changed
    alias: kitchen_precense_state_changed
    trigger:
      - platform: event
        event_type: precense_state_changed
    action:
      - choose:
          - conditions: "{{ trigger.event.data.state in ['present','relaxing'] }}"
            sequence:
              - service: script.kitchen_probe_light_off

        default:
          - service: script.kitchen_lights_off
          - service: media_player.turn_off
            target:
              entity_id: "{{ area_id('Kitchen') }}"

```
In Gherkin you could write for the present states:

```gehrkin
  Scenario Outline: House enters into a present state
    When the house enters into a <present state>
    Then adjust the kitchen lights

    Scenarios:
      | present state |
      | present       |
      | relaxing      |
```
Now it nicely only triggers on specific present states, but for the default case (all other states) is harder to describe or implement because you cannot trigger values not existing.

The work around I suggest is to use the words WILL BE:

```gehrkin
Scenario: House enters into a non-present state
    Given the triggered state WILL not BE a present state
    When the house precense state changes
    Then turn off the kitchen lights
    And turn off all kitchen media
```

The implementation could look like, using the trigger variable in the condition:

```yaml
- alias: |-
    Scenario keuken: House enters into a non-present state
  id: scenario_kitchen_house_enters_into_a_non_present_state
  mode: restart
  # GIVEN
  condition:
    - alias: |-
        Given the triggered state will not be a present state
      condition: template
      value_template: "{{ trigger.event.data.state not in ['present','relaxing'] }}"

  # WHEN
  trigger:
    # When the house precense state changes
    - platform: event
      event_type: precense_state_changed


  action:
    - alias: |-
         Then turn off the kitchen lights
      service: script.kitchen_lights_off

    ...
```
