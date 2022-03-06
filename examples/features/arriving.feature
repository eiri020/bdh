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