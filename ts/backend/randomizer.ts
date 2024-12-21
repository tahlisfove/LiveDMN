import fs from "fs";
import path from "path";
import { parse } from "papaparse";
import { Request, Response } from "express";
import { AppDataSource } from "./data-source";
import { RequestLog } from "./entities/RequestLog";

// Define a type for the CSV data rows
interface OpenFoodFactsRow {
  code: string;
  countries_en: string;
}

interface JobRow {
  job_title: string;
  salary_in_usd: string;
}

interface NudgerRow {
  gtin: string;
  gs1_country: string;
}

// Function to clean up spaces in the data
function cleanData(data: string): string {
  // Supprimer les espaces avant et après la chaîne
  let cleanedData = data.trim();

  // Remplacer les espaces multiples par un seul espace
  cleanedData = cleanedData.replace(/\s+/g, ' ');

  return cleanedData;
}

// Function to save the request log into the database
async function saveRequestLog(data: any[], numValues: number, source: string): Promise<void> {
  try {
    // Appliquer le nettoyage des données
    const cleanedData = data.map((item) => {
      if (item['Barcode (EAN 13)']) {
        item['Barcode (EAN 13)'] = cleanData(item['Barcode (EAN 13)']);
      }
      if (item['Country']) {
        item['Country'] = cleanData(item['Country']);
      }
      if (item['Job Title']) {
        item['Job Title'] = cleanData(item['Job Title']);
      }
      if (item['Salary (USD)']) {
        item['Salary (USD)'] = cleanData(item['Salary (USD)']);
      }
      if (item['GTIN']) {
        item['GTIN'] = cleanData(item['GTIN']);
      }
      return item;
    });

    const requestLog = new RequestLog();
    requestLog.source = source;
    requestLog.numValues = numValues;
    requestLog.extractedData = JSON.stringify(cleanedData); // Save the cleaned data
    requestLog.requestTime = new Date().toISOString();

    // Save the log in the database
    await AppDataSource.getRepository(RequestLog).save(requestLog);
  } catch (error) {
    console.error("Failed to save log to database:", error);
  }
}

export const randomizeDataRoute = async (req: Request, res: Response): Promise<void> => {
  const { source, numValues } = req.body;

  // Validate the source
  if (!["openfoodfacts", "nudger", "job"].includes(source)) {
    res.status(400).json({ error: "Invalid source" });
    return;
  }

  const inputFilePath = path.join("./dist", `${source}.csv`);
  const outputFilePath = path.join("./dist", `randomized-${source}.json`);

  // Check if the source file exists
  if (!fs.existsSync(inputFilePath)) {
    res.status(404).json({ error: "Source file not found" });
    return;
  }

  let responseSent = false;

  try {
    // Temporary array to store the selected rows
    const selectedData: any[] = [];
    let processedLines = 0;
    let selectedLines = 0;

    // Create a read stream and parse the CSV file
    const readStream = fs.createReadStream(inputFilePath);
    parse(readStream, {
      header: true,
      skipEmptyLines: true,
      step: async (row) => {
        processedLines++;

        // Random selection probability of 1/100
        if (Math.random() <= 1 / 100) {
          let selectedRow = null;
          // Process data based on the source
          if (source === "openfoodfacts") {
            const data = row.data as OpenFoodFactsRow;
            selectedRow = { "Barcode (EAN 13)": data["code"], Country: data["countries_en"] };
          } else if (source === "job") {
            const data = row.data as JobRow;
            selectedRow = { "Job Title": data["job_title"], "Salary (USD)": data["salary_in_usd"] };
          } else if (source === "nudger") {
            const data = row.data as NudgerRow;
            selectedRow = { GTIN: data["gtin"], Country: data["gs1_country"] };
          }

          // If a valid row is found, add it to the selected data
          if (selectedRow) {
            selectedData.push(selectedRow);
            selectedLines++;

            // If the required number of lines is reached, stop randomizing and send the response
            if (selectedLines >= numValues && !responseSent) {
              responseSent = true;
              // Save the selected data in a JSON file
              fs.writeFileSync(outputFilePath, JSON.stringify(selectedData, null, 2), "utf-8");
              console.log(`\nRandomization complete:\n${numValues} rows saved to: ${outputFilePath}`);

              // Save the log to the database
              await saveRequestLog(selectedData, numValues, source); // Vous pouvez maintenant utiliser "await"

              // Send the selected data and the file path to the frontend
              res.json({
                status: "RANDOMIZED",
                data: selectedData.slice(0, numValues), // Make sure only numValues are sent
              });
            }
          }
        }
      },
      complete: () => {
        // If the randomization did not reach the required number of rows and response has not been sent yet
        if (selectedLines < numValues && !responseSent) {
          responseSent = true;

          // If not enough rows were selected, log the issue
          console.log(`\nRandomization incomplete:\nOnly ${selectedLines} rows available (requested ${numValues}).`);

          // Save the selected data in a JSON file
          fs.writeFileSync(outputFilePath, JSON.stringify(selectedData, null, 2), "utf-8");

          // Save the log to the database
          saveRequestLog(selectedData, selectedLines, source);

          // Send the response with the data and file path
          res.json({
            status: "RANDOMIZED",
            data: selectedData.slice(0, numValues), // Ensure only the required number of rows are sent
            message: `Only ${selectedLines} rows selected. Less than the requested ${numValues}.`
          });
        }
      },
      error: (err) => {
        // Handle errors
        console.error("Error reading the file:", err);
        if (!responseSent) {
          responseSent = true;
          res.status(500).json({ error: "Error during data randomization." });
        }
      },
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
    if (!responseSent) {
      responseSent = true;
      res.status(500).json({ error: "Unexpected error." });
    }
  }
};