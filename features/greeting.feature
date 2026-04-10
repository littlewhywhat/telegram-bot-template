@cron
Feature: Daily greeting
  As the system
  I want to send a daily greeting to all ready users
  So that they receive motivation with their name

  Background:
    Given a user exists with chatId 100 and state "ready" and name "Alice"
    And a user exists with chatId 200 and state "ready" and name "Bob"
    And a user exists with chatId 300 and state "awaiting_name"

  Scenario: Morning greeting at 7 UTC
    Given the current UTC hour is 7
    When the cron job runs
    Then the bot sends a message starting with "Good morning, Alice!" to chatId 100
    And the bot sends a message starting with "Good morning, Bob!" to chatId 200
    And the bot does not send a message to chatId 300
    And 2 bot messages are stored with direction "bot"

  Scenario: Evening greeting at 19 UTC
    Given the current UTC hour is 19
    When the cron job runs
    Then the bot sends a message starting with "Good evening, Alice!" to chatId 100
    And the bot sends a message starting with "Good evening, Bob!" to chatId 200

  Scenario: Each greeting includes a motivational quote
    Given the current UTC hour is 7
    When the cron job runs
    Then each sent message contains a quote from the quotes list
