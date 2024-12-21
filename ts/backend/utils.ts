import { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import { downloadAndExtractZip } from "./zipFileHandler";
import { downloadAndExtractGzip } from "./gzFileHandler";

// Directory to store the downloaded and extracted files
const distDir = "./dist";
// Port for the server
const port = 3000;

// Mapping of data sources with their download URLs
const dataSources: { [key: string]: string } = {
  openfoodfacts: "https://openfoodfacts-ds.s3.eu-west-3.amazonaws.com/en.openfoodfacts.org.products.csv.gz",
  nudger: "https://nudger.fr/opendata/gtin-open-data.zip",
  job: "https://github.com/tahlisfove/UPPA/raw/main/master_informatique/m2_informatique/composant_services_logiciels/archive_job.zip"
};

// Defining different routes for downloading and extracting files
const downloadExtractRoute = Router();
const downloadRoute = Router();
const checkFileRoute = Router();

// Route to download and extract either a ZIP or GZ file based on the source
downloadExtractRoute.get("/", async (req: Request, res: Response): Promise<void> => {
  const source = req.query.source as string;

  // Check if the source parameter is valid
  if (!dataSources[source]) {
    res.status(400).json({ error: "Invalid source selected." });
    return;
  }

  try {
    const url = dataSources[source];
    const fileName = path.basename(url);
    const filePath = path.join(distDir, fileName); 

    let outputFileName = "output.csv";
    switch (source) {
      case "openfoodfacts":
        outputFileName = "openfoodfacts.csv";
        break;
      case "nudger":
        outputFileName = "nudger.csv";
        break;
      case "job":
        outputFileName = "job.csv";
        break;
    }

    // Handle ZIP file download and extraction
    if (url.endsWith(".zip")) {
      const csvFilePath = await downloadAndExtractZip(url, filePath, outputFileName);
      res.json({
        status: "SUCCESS",
        message: "File downloaded and extracted successfully from the ZIP file.",
        downloadLink: `http://localhost:${port}/download/${path.basename(csvFilePath)}`
      });
    } 
    // Handle GZ file download and extraction
    else if (url.endsWith(".gz")) {
      const outputFilePath = path.join(distDir, outputFileName);
      await downloadAndExtractGzip(url, outputFilePath);
      res.json({
        status: "SUCCESS",
        message: "File downloaded and extracted successfully from the .gz file.",
        downloadLink: `http://localhost:${port}/download/${path.basename(outputFilePath)}`
      });
    } else {
      // Return error if the file format is not .zip or .gz
      res.status(400).json({ error: "Unsupported file format. Only .zip and .gz are allowed." });
    }
  } catch (error) {
    // Log and return error in case of failure
    console.error("Error during file download or extraction:", error);
    res.status(500).json({ error: "An error occurred during file download or extraction." });
  }
});

// Route to download the extracted file
downloadRoute.get("/:fileName", (req: Request, res: Response) => {
  const fileName = req.params.fileName;
  const filePath = path.join(distDir, fileName);

  // Check if the file exists and allow the client to download it
  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error during file download:", err);
        res.status(500).send("Error during file download.");
      }
    });
  } else {
    res.status(404).send("File not found.");
  }
});

// Route to check if the file corresponding to the source exists
checkFileRoute.get("/", (req: Request, res: Response) => {
  const source = req.query.source as string;
  const filePath = path.join(distDir, `${source}.csv`);
  const isFileAvailable = fs.existsSync(filePath);
  res.json({ available: isFileAvailable });
});

export { downloadExtractRoute, downloadRoute, checkFileRoute };