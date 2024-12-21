import fs from "fs";
import yauzl from "yauzl";
import path from "path";
import axios from "axios";

// Directory to store files after extraction
const distDir = "./dist";
// Check if the directory exists, if not, create it
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Function to check if the file exists at the given path
const fileExists = (filePath: string): boolean => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error(`Error checking file existence: ${err}`);
    return false;
  }
};

// Function to download the ZIP file if necessary and extract the CSV
export async function downloadAndExtractZip(
  url: string,
  outputFilePath: string,
  outputFileName: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // If the ZIP file doesn't exist, download it
      if (!fileExists(outputFilePath)) {
        console.log(`\nDownloading and extracting ZIP file...`);
        const response = await axios.get(url, { responseType: "stream" });
        const writeStream = fs.createWriteStream(outputFilePath);
        response.data.pipe(writeStream);

        // Once the ZIP file is downloaded, proceed with extraction
        writeStream.on("finish", () => {
          extractCsvFromZip(outputFilePath, distDir, outputFileName, resolve, reject);
        });

        // Handle any error during download
        writeStream.on("error", (err) => {
          reject(new Error(`Error downloading the ZIP file: ${err.message}`));
        });
      } else {
        // If the ZIP file already exists, proceed with extraction
        extractCsvFromZip(outputFilePath, distDir, outputFileName, resolve, reject);
      }
    } catch (error: unknown) {
      // Check if the error is an instance of Error before accessing 'message'
      if (error instanceof Error) {
        reject(new Error(`Error during ZIP file download: ${error.message}`));
      } else {
        reject(new Error("An unknown error occurred during the ZIP file download."));
      }
    }
  });
}

// Function to extract the CSV file from the ZIP
function extractCsvFromZip(
  zipFilePath: string,
  outputFolder: string,
  outputFileName: string,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
): void {
  yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
    if (err || !zipfile) {
      // Handle errors when opening the ZIP file
      const errorMessage = err ? err.message : 'Unknown error';
      return reject(new Error(`Error opening the ZIP: ${errorMessage}`));
    }

    zipfile.readEntry();

    zipfile.on("entry", (entry) => {
      // If the entry is a CSV file, proceed to extract it
      if (entry.fileName.endsWith(".csv")) {
        const csvFilePath = path.join(outputFolder, outputFileName);
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err || !readStream) {
            // Handle errors while opening the read stream
            return reject(new Error("Error opening the read stream."));
          }

          // Create a write stream to save the extracted CSV
          const writeStream = fs.createWriteStream(csvFilePath);
          readStream.pipe(writeStream);

          // Once the file is written, close the ZIP and resolve the promise
          writeStream.on("finish", () => {
            console.log(`CSV file downloaded and decompressed successfully!`);
            zipfile.close();

            // Delete the ZIP file after extraction
            fs.unlinkSync(zipFilePath);
            
            resolve(csvFilePath);
          });

          // Handle errors during file writing
          writeStream.on("error", (err) => {
            console.error("Error during file writing:", err);
            reject(err);
          });

          // Handle errors during file reading
          readStream.on("error", (err) => {
            console.error("Error during file reading:", err);
            reject(err);
          });
        });
      } else {
        // If the entry is not a CSV, continue to the next entry
        zipfile.readEntry();
      }
    });

    // If no CSV file is found in the ZIP archive, reject the promise
    zipfile.on("end", () => {
      reject(new Error("No CSV file found in the ZIP archive."));
    });
  });
}