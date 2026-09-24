Feature: Contact Request Retention and Cleanup
  As a Firebase operations/maintenance engineer
  I want contact-request retention to be consistent and configurable
  So that records are not deleted earlier/later than intended and retention can be changed safely

  Background:
    Given the cleanupOldContactRequests function is deployed
    And the Firebase Realtime Database contains contact requests

  Scenario: Default retention period is used when no configuration provided
    Given no retention period configuration is provided
    When the cleanupOldContactRequests function runs
    Then it should use a default retention period of 90 days
    And it should log the effective retention days as 90
    And it should calculate the cutoff timestamp as (current_time - 90 days)

  Scenario: Custom retention period is applied from configuration
    Given the retention period is configured to 30 days
    When the cleanupOldContactRequests function runs
    Then it should use the configured retention period of 30 days
    And it should log the effective retention days as 30
    And it should calculate the cutoff timestamp as (current_time - 30 days)

  Scenario: Contact request older than retention period is deleted
    Given the retention period is set to 90 days
    And a contact request exists with createdAt timestamp of 91 days ago
    When the cleanupOldContactRequests function runs
    Then the contact request should be deleted
    And the totalDeleted count should be incremented
    And the deletion should be logged

  Scenario: Contact request newer than retention period is preserved
    Given the retention period is set to 90 days
    And a contact request exists with createdAt timestamp of 89 days ago
    When the cleanupOldContactRequests function runs
    Then the contact request should NOT be deleted
    And the totalDeleted count should remain 0
    And the preservation should be logged as totalPreserved

  Scenario: Contact request exactly at cutoff timestamp is preserved (boundary condition)
    Given the retention period is set to 90 days
    And a contact request exists with createdAt timestamp exactly at the cutoff
    When the cleanupOldContactRequests function runs
    Then the contact request should NOT be deleted
    And the boundary behavior should be explicit in the code: createdAt < cutoff
    And the contact request should be counted in totalInspected
    And the contact request should be counted in totalPreserved

  Scenario: Contact request 1 millisecond before cutoff is deleted
    Given the retention period is set to 90 days
    And a contact request exists with createdAt timestamp of (cutoff - 1 millisecond)
    When the cleanupOldContactRequests function runs
    Then the contact request should be deleted
    And the totalDeleted count should be incremented

  Scenario: Contact request 1 millisecond after cutoff is preserved
    Given the retention period is set to 90 days
    And a contact request exists with createdAt timestamp of (cutoff + 1 millisecond)
    When the cleanupOldContactRequests function runs
    Then the contact request should NOT be deleted
    And the totalDeleted count should remain 0

  Scenario: No contact requests to clean up
    Given the retention period is set to 90 days
    And all contact requests are newer than 90 days
    When the cleanupOldContactRequests function runs
    Then no contact requests should be deleted
    And it should log "nothing to clean up"
    And the totalInspected count should be 0
    And the totalDeleted count should be 0

  Scenario: Batch limit reached during cleanup
    Given the retention period is set to 90 days
    And there are more than 200 contact requests older than 90 days
    When the cleanupOldContactRequests function runs
    Then it should process exactly 200 contact requests (batch limit)
    And it should delete the eligible contact requests from the batch
    And it should log a warning: "batch limit reached — more old requests may remain"
    And it should include batchSize and retentionDays in the warning log

  Scenario: Multiple contact requests with mixed ages
    Given the retention period is set to 90 days
    And the following contact requests exist:
      | contactId | createdAt (days ago) | expected action |
      | req-001   | 100                  | delete          |
      | req-002   | 91                   | delete          |
      | req-003   | 90 (at cutoff)       | preserve        |
      | req-004   | 89                   | preserve        |
      | req-005   | 30                   | preserve        |
      | req-006   | 1                    | preserve        |
    When the cleanupOldContactRequests function runs
    Then contact requests req-001 and req-002 should be deleted
    And contact requests req-003, req-004, req-005, and req-006 should be preserved
    And the totalDeleted count should be 2
    And the totalPreserved count should be 4

  Scenario: Structured logging includes all required information
    Given the retention period is set to 90 days
    And contact requests exist for cleanup
    When the cleanupOldContactRequests function runs
    Then the start log should include:
      | field              | type     | required |
      | retentionDays      | number   | yes      |
      | cutoffTimestamp    | number   | yes      |
      | cutoffDate         | string   | yes      |
      | currentTimestamp   | number   | yes      |
      | currentDate        | string   | yes      |
    And the completion log should include:
      | field              | type     | required |
      | retentionDays      | number   | yes      |
      | totalInspected     | number   | yes      |
      | totalDeleted       | number   | yes      |
      | totalPreserved     | number   | yes      |
      | cutoffTimestamp    | number   | yes      |
      | cutoffDate         | string   | yes      |

  Scenario: Contact request with missing createdAt field
    Given the retention period is set to 90 days
    And a contact request exists with no createdAt field (defaults to 0)
    When the cleanupOldContactRequests function runs
    Then the contact request should be deleted (createdAt 0 is older than any cutoff)
    And the totalDeleted count should be incremented

  Scenario: Configuration change from 14 days to 90 days
    Given the retention period was previously set to 14 days
    And the retention period is now configured to 90 days
    And contact requests exist that are 30 days old
    When the cleanupOldContactRequests function runs
    Then the 30-day-old contact requests should be preserved (newer than 90 days)
    And it should use the new retention period of 90 days
    And it should log the effective retention days as 90

  Scenario: Verify database query uses correct parameters
    Given the retention period is set to 90 days
    When the cleanupOldContactRequests function runs
    Then it should query the "contactRequests" reference
    And it should orderByChild "createdAt"
    And it should use endAt with the calculated cutoff timestamp
    And it should limitToFirst BATCH_SIZE (200)

  Scenario: Updates are only applied when there are deletions
    Given the retention period is set to 90 days
    And all contact requests are newer than the cutoff
    When the cleanupOldContactRequests function runs
    Then no database update should be performed
    And totalDeleted should be 0
    And the function should exit early with "nothing to clean up" log

  Scenario: Verify cutoff timestamp calculation accuracy
    Given the retention period is set to 90 days
    And the current timestamp is 1704067200000 (2024-01-01 00:00:00 UTC)
    When the cutoff timestamp is calculated
    Then the cutoff should be 1696291200000 (2023-10-03 00:00:00 UTC)
    And the difference should be exactly 7776000000 milliseconds (90 days)
