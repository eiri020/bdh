Feature: Scenario Outline example

  Scenario: Switch off lights and plugs when nobody is home or sleeping
    When the house precense state changes
    Then make sure all electricity plugs are switched off 
    And when this state is not present then switch of table lights


  Scenario Outline: Outline Switch off lights and plugs when nobody is home or sleeping 
    When the house precense state changes to <precense state>
    Then make sure all electricity plugs are switched off 
    And when this state is not present then switch of table lights

  Scenarios:
    | precense state |
    | shopping       |
    | daily          |
    | trip           |
    | sleeping       |
