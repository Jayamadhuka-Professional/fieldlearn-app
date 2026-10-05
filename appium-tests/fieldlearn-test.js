const { remote } = require('webdriverio');

async function runTest() {
  const driver = await remote({
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    capabilities: {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': 'A9VUCP5818404584',
      'appium:udid': 'A9VUCP5818404584',
      'appium:appPackage': 'host.exp.exponent',
      'appium:appActivity':
        'host.exp.exponent.experience.ExperienceActivity',
      'appium:noReset': true,
    },
  });

  try {
    console.log('FieldLearn Appium test started.');

    await driver.pause(2000);

    // Find the observation field using the accessibility ID
    const observationInput = await driver.$(
      '~Activity Observation'
    );

    await observationInput.waitForDisplayed({
      timeout: 10000,
    });

    await observationInput.click();

    await observationInput.clearValue();

    const expectedObservation =
    'Appium automated field observation';

    await observationInput.setValue(expectedObservation);

    // Read the value back from the actual field
    const actualObservation =
    await observationInput.getText();

    console.log('Expected:', expectedObservation);
    console.log('Actual:', actualObservation);

    if (actualObservation === expectedObservation) {
    console.log('PASS: Observation text matches expected value.');
    } else {
    throw new Error(
        `Observation mismatch. Expected "${expectedObservation}" but received "${actualObservation}".`
    );
    }

    await driver.pause(3000);
  } catch (error) {
    console.error('FAIL: Appium test failed.');
    console.error(error);
  } finally {
    await driver.deleteSession();
  }
}

runTest();