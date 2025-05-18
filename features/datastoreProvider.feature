Feature: DatastoreProvider TCP Features 

  Scenario: Saving a model over TCP
    Given we create a mock http provider
    And we use a datastoreProvider with the standard functions and httpProvider 
    When we create an instance of TestModel with TEST_1_MODEL data
    And we call "save" on the datastoreProvider with the model
    Then the http information passed to the httpProvider matches TEST_1_MODEL_RESULTS

  Scenario: Retrieving a model over TCP
    Given we create a mock http provider
    And we use a datastoreProvider with the standard functions and httpProvider 
    When we call "retrieve" on the datastoreProvider with TEST_2
    Then the http information passed to the httpProvider matches TEST_2_MODEL_RESULTS

  Scenario: Deleting a model over TCP
    Given we create a mock http provider
    And we use a datastoreProvider with the standard functions and httpProvider 
    When we create an instance of TestModel with TEST_3_MODEL data
    And we call "delete" on the datastoreProvider with the model
    Then the http information passed to the httpProvider matches TEST_3_MODEL_RESULTS

  Scenario: Searching models over TCP
    Given we create a mock http provider
    And we use a datastoreProvider with the standard functions and httpProvider 
    When we call "search" on the datastoreProvider with TEST_4
    Then the http information passed to the httpProvider matches TEST_4_MODEL_RESULTS

  Scenario: Bulk inserting models over TCP
    Given we create a mock http provider
    And we use a datastoreProvider with the standard functions and httpProvider 
    When we call "bulkInsert" on the datastoreProvider with TEST_5
    Then the http information passed to the httpProvider matches TEST_5_MODEL_RESULTS
