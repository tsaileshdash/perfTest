Feature: Activity create API
  As a consumer of the Fakerest API
  I want to create activity records
  So that I can validate the create endpoint works and rejects invalid payloads

  Scenario: Create activity with valid payload returns success
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a POST request to "/Activities" with accept header "text/plain; v=1.0" and JSON body "{\"id\":0,\"title\":\"string\",\"dueDate\":\"2026-09-09T16:14:56.159Z\",\"completed\":true}"
    Then the response status should be 200
    And the response content type should contain "application/json"

  Scenario: Create activity with invalid JSON body returns 400
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a POST request to "/Activities" with accept header "text/plain; v=1.0" and JSON body "{bad-json}"
    Then the response status should be 400
