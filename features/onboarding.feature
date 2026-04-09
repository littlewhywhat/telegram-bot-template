@onboarding
Feature: Name onboarding
  As a user who sent /start
  I want to reply with my name
  So that the bot stores it and marks me as ready

  Background:
    Given a user exists with chatId 789 and state "awaiting_name"

  Scenario: User replies with their name
    When the user sends "Alice" from chatId 789
    Then the bot replies "Nice to meet you, Alice!" to chatId 789
    And the user with chatId 789 has name "Alice"
    And the user with chatId 789 has state "ready"
    And a user message "Alice" is stored for chatId 789
    And a bot message "Nice to meet you, Alice!" is stored for chatId 789

  Scenario: User sends empty message while awaiting name
    When the user sends " " from chatId 789
    Then the bot replies "Please tell me your name." to chatId 789
    And the user with chatId 789 has state "awaiting_name"
