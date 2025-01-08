const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 3002;

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to scrape TikTok video data
app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the TikTok URL
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    // Extract data
    const data = await page.evaluate(() => {
      const videoUrl = document.querySelector("video source")?.src || null;
      const thumbnail =
        document.querySelector("div.css-8czf5p-StyledVideoBlurBackground img")
          ?.src || null;
      const title =
        document
          .querySelector("h1[data-e2e='browse-video-desc'] span")
          ?.innerText.trim() || null;
      const duration =
        document
          .querySelector("div.css-1cuqcrm-DivSeekBarTimeContainer")
          ?.innerText.trim() || null;

      return { videoUrl, thumbnail, title, duration };
    });

    // Close the browser
    await browser.close();
    console.log(data);
    console.log(data.videoUrl);
    console.log(data.thumbnail);
    console.log(data.title);
    console.log(data.duration);

    console.log(
      !data.videoUrl || !data.thumbnail || !data.title || !data.duration
    );
    // Check if all required fields were extracted
    if (!data.videoUrl || !data.thumbnail || !data.title || !data.duration) {
      console.log("going to if")
      return res
        .status(500)
        .json({
          error: "Failed to extract video data. Structure might have changed.",
        });
    }
    data.videoUrl = url;
    // Respond with the extracted data
    res.json(data);
  } catch (error) {
    console.error("Error scraping TikTok:", error.message);
    res.status(500).json({ error: "Failed to scrape the TikTok page." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
