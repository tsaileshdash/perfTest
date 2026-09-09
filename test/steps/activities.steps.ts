import { Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { request as playwrightRequest } from '@playwright/test';
import { strict as assert } from 'node:assert';

setDefaultTimeout(30000);

When('I send a GET request to {string} with accept header {string}', async function (path: string, acceptHeader: string) {
  const apiRequest = await playwrightRequest.newContext();

  try {
    const response = await apiRequest.get(`${this.baseUrl}${path}`, {
      headers: {
        accept: acceptHeader,
      },
    });

    this.response = {
      status: response.status(),
      headers: response.headers(),
      body: await response.text(),
    };
  } finally {
    await apiRequest.dispose();
  }
});

When('I send a POST request to {string} with accept header {string} and JSON body {string}', async function (path: string, acceptHeader: string, requestBody: string) {
  const apiRequest = await playwrightRequest.newContext();

  try {
    const payload = JSON.parse(requestBody);
    const response = await apiRequest.post(`${this.baseUrl}${path}`, {
      headers: {
        accept: acceptHeader,
        'Content-Type': 'application/json; v=1.0',
      },
      data: JSON.stringify(payload),
    });

    this.response = {
      status: response.status(),
      headers: response.headers(),
      body: await response.text(),
    };
  } finally {
    await apiRequest.dispose();
  }
});

Given('the API base URL is {string}', function (baseUrl: string) {
  this.baseUrl = baseUrl;
});

Then('the response status should be {int}', function (expectedStatus: number) {
  assert.equal(this.response.status, expectedStatus, `Expected status ${expectedStatus} but got ${this.response.status}`);
});

Then('the response content type should contain {string}', function (expectedText: string) {
  const contentType = this.response.headers['content-type'] || '';
  assert.ok(contentType.includes(expectedText), `Expected Content-Type to contain "${expectedText}" but got "${contentType}"`);
});

Then('the response should contain an array with at least 1 item', function () {
  const parsed = JSON.parse(this.response.body);
  assert.ok(Array.isArray(parsed), 'Expected response body to be an array');
  assert.ok(parsed.length >= 1, 'Expected at least one activity in the array');
  this.response.json = parsed;
});

Then('the first activity should have title {string}', function (expectedTitle: string) {
  const activities = this.response.json;
  assert.ok(Array.isArray(activities) && activities.length > 0, 'No activities found in the response');
  assert.equal(activities[0].title, expectedTitle, `Expected first activity title to be "${expectedTitle}"`);
});
