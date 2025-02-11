const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = 3000;

app.get("/scrape", async (req, res) => {
  try {
    const facebookData = [];
    const instagramData = [];
    const GENERAL_LABELS_SIZE = 5;
    const GENERAL_TABLE_SIZE = 11;
    const URL = "https://lookerstudio.google.com/u/0/reporting/36960dab-5e03-4c64-8b14-cf4c76c61e40/page/p_pj1bqu80od?s=spVfW1z_NAs";
    const labels = [
      "Impresiones",
      "Reacciones",
      "Alcance",
      "Costo por reacción",
      "Reproducciones (15 seg)",
    ];

    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: "load", timeout: 120000 });

    await page.waitForSelector("div.valueLabel", { timeout: 120000 });
    await page.waitForSelector("div.cell", { timeout: 120000 });

    const valueLabelElements = await page.$$("div.valueLabel");
    const valueLabelCells = await page.$$("div.cell");

    const generalLabelsData = await Promise.all(
      valueLabelElements.map(el => el.innerText())
    );

    const generalLabels = labels.map((label, i) => ({
      title: label,
      value: generalLabelsData[i],
    }));

    const cellsLabels = await Promise.all(
      valueLabelCells.map(cell => cell.innerText())
    );

    const arrayChunked = [];
    for (let i = 0; i < cellsLabels.length; i += GENERAL_TABLE_SIZE) {
      arrayChunked.push(cellsLabels.slice(i, i + GENERAL_TABLE_SIZE));
    }

    let isSectionTwo = false;
    for (const chunk of arrayChunked) {
      if (chunk[0] === "1.") {
        isSectionTwo = !isSectionTwo;
      }
      if (isSectionTwo) {
        instagramData.push(chunk);
      } else {
        facebookData.push(chunk);
      }
    }

    await browser.close();

    res.json({
      generalLabels,
      facebookData,
      instagramData,
    });
  } catch (error) {
    console.error("Error scraping data:", error);
    res.status(500).json({ error: "Failed to scrape data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

