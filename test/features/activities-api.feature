Feature: Activities API
  As a consumer of the Fakerest API
  I want to retrieve activities
  So that I can validate the API contract for acceptance testing

  Scenario: Retrieve all activities
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities" with accept header "text/plain; v=1.0"
    Then the response status should be 200
    And the response content type should contain "application/json"
    And the response should contain an array with at least 1 item
    And the first activity should have title "Activity 1"
