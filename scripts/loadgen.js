const { chromium } = require("playwright");
const fs = require("fs");

// Configuration
const config = {
  baseUrl: process.env.BASE_URL || "http://localhost:10114",
  iterations: parseInt(process.env.ITERATIONS || "10"), // Number of times to click GO and rate
  minDelay: parseInt(process.env.MIN_DELAY || "2000"), // Minimum delay between actions in ms
  maxDelay: parseInt(process.env.MAX_DELAY || "5000"), // Maximum delay between actions in ms
  headless: process.env.HEADLESS !== "false", // Set to false to see the browser
  logFile: process.env.LOG_FILE || "./loadgen.log",
  timeout: parseInt(process.env.TIMEOUT || "15000"), // Timeout for waiting for elements in ms
  ratingTimeout: parseInt(process.env.RATING_TIMEOUT || "5000"), // Timeout for waiting for rating confirmation
  continueOnError: process.env.CONTINUE_ON_ERROR !== "false", // Whether to continue on errors
};

// Helper function to sleep for a random amount of time
function sleep(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
  fs.appendFileSync(config.logFile, logMessage + "\n");
}

// Main function
async function runLoadTest() {
  log(`Starting load test with ${config.iterations} iterations`);

  // Initialize log file
  if (fs.existsSync(config.logFile)) {
    fs.unlinkSync(config.logFile);
  }

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the page
    log(`Navigating to ${config.baseUrl}`);
    await page.goto(config.baseUrl);

    // Wait for the page to load and user-info to be populated
    await page.waitForSelector(".user-info", { state: "attached" });
    log("Page loaded successfully");

    // Get the initial user info
    const userName = (await page.textContent(".user-name")) || "Unknown";
    log(`User loaded: ${userName}`);

    // Perform multiple iterations of clicking GO and rating
    for (let i = 0; i < config.iterations; i++) {
      log(`Starting iteration ${i + 1}/${config.iterations}`);

      // Click the GO button
      log("Clicking GO button");
      await page.click("#go");

      try {
        // Wait for either the image to load or an error message
        log("Waiting for response...");
        await Promise.race([
          page.waitForSelector("#picture", { state: "visible", timeout: config.timeout }),
          page.waitForSelector('#message:visible:text-matches("error")', { timeout: config.timeout }),
        ]);

        // Check if we got an image or an error
        const isImageVisible = await page.isVisible("#picture");
        const errorMessage = await page.$eval("#message", (el) => el.innerText).catch(() => "");

        if (isImageVisible) {
          log("Image loaded successfully");
        } else {
          log(`Error occurred: ${errorMessage}`);
        }
      } catch (error) {
        // Timeout or other error
        log(`Timeout or error waiting for response: ${error.message}`);
      }

      // Wait a bit to simulate viewing the image or error
      await sleep(config.minDelay, config.maxDelay);

      // Try to give a rating if the feedback element is visible
      const isFeedbackVisible = await page.isVisible("#feedback");

      if (isFeedbackVisible) {
        // Check if rating buttons are available
        const hasRatingButtons = (await page.isVisible("#thumbs-up")) || (await page.isVisible("#thumbs-down"));

        if (hasRatingButtons) {
          // Give a random rating (thumbs up or down)
          const ratingSelector = Math.random() > 0.5 ? "#thumbs-up" : "#thumbs-down";
          const ratingText = ratingSelector === "#thumbs-up" ? "thumbs up" : "thumbs down";
          log(`Giving rating: ${ratingText}`);

          try {
            await page.click(ratingSelector);

            // Try to wait for the thank you message, but don't fail if it doesn't appear
            try {
              await page.waitForFunction(
                () => {
                  const feedback = document.getElementById("feedback");
                  return feedback && feedback.innerText.includes("Thanks for your feedback");
                },
                { timeout: config.ratingTimeout }
              );
              log("Rating submitted successfully");
            } catch (error) {
              log(`Rating submission feedback not detected: ${error.message}`);
            }
          } catch (error) {
            log(`Failed to click rating button: ${error.message}`);
          }
        } else {
          log("Rating buttons not available");
        }
      } else {
        log("Feedback form not visible, skipping rating");
      }

      // Wait before the next iteration
      if (i < config.iterations - 1) {
        const waitTime = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
        log(`Waiting ${waitTime}ms before next iteration`);
        await sleep(config.minDelay, config.maxDelay);
      }
    }

    log("Load test completed successfully");
  } catch (error) {
    log(`Error during load test: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
    log("Browser closed");
  }
}

// Run the load test
runLoadTest().catch(console.error);
