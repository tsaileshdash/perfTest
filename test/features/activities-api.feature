Feature: Activities API
  As a consumer of the Fakerest API
  I want to retrieve activities
  So that I can validate the API contract for acceptance testing

  Scenario: Health check returns success for activities endpoint
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities" with accept header "text/plain; v=1.0"
    Then the response status should be 200
    And the response content type should contain "application/json"

  Scenario: Health check returns success for specific activity
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities/1" with accept header "text/plain; v=1.0"
    Then the response status should be 200
    And the response content type should contain "application/json"

  Scenario: Health check returns failure for missing endpoint
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/ThisEndpointDoesNotExist" with accept header "text/plain; v=1.0"
    Then the response status should be 404

  Scenario: Health check returns failure for invalid activity id
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities/999999" with accept header "text/plain; v=1.0"
    Then the response status should be 404

  Scenario: Retrieve all activities
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities" with accept header "text/plain; v=1.0"
    Then the response status should be 200
    And the response content type should contain "application/json"
    And the response should contain an array with at least 1 item
    And the first activity should have title "Activity 1"

  Scenario: Retrieve activity by valid id
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities/1" with accept header "text/plain; v=1.0"
    Then the response status should be 200
    And the response content type should contain "application/json"

  Scenario: Invalid route should not return activity list
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/ActivitiesNotFound" with accept header "text/plain; v=1.0"
    Then the response status should be 404
