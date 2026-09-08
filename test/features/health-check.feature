Feature: API health check
  As a service consumer
  I want to validate the endpoint health status
  So that I can confirm the API is working and failing correctly when missing

  Scenario: Health check returns success when the activities endpoint is reachable
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/Activities" with accept header "text/plain; v=1.0"
    Then the response status should be 200
    And the response content type should contain "application/json"

  Scenario: Health check returns failure when the endpoint is missing
    Given the API base URL is "https://fakerestapi.azurewebsites.net/api/v1"
    When I send a GET request to "/ThisEndpointDoesNotExist" with accept header "text/plain; v=1.0"
    Then the response status should be 404
