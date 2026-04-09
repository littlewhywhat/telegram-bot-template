@bot
Feature: Start command
  As a new user
  I want to send /start to the bot
  So that the bot asks for my name

  Scenario: New user sends /start
    Given no user exists with chatId 123
    When the user sends "/start" from chatId 123
    Then the bot replies "What is your name?" to chatId 123
    And a user record exists with chatId 123 and state "awaiting_name"
    And a bot message "What is your name?" is stored for chatId 123

  Scenario: Existing user sends /start again
    Given a user exists with chatId 456 and state "ready" and name "Alice"
    When the user sends "/start" from chatId 456
    Then the bot replies "What is your name?" to chatId 456
    And the user with chatId 456 has state "awaiting_name"
