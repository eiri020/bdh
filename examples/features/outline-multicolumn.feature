Feature: Scenario Outline example

  Scenario Outline: Outline Switch off lights and plugs when nobody is home or sleeping 
    When the house precense state changes to <precense state>
    Then make sure all electricity plugs are switched off 
    And activate <scene>


  Scenarios:
    | precense state | scene    |
    | present        | normal   |
    | relaxing       | soft     |
    | trip           | off      |
    | sleeping       | off      |
