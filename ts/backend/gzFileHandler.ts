import axios from "axios";
import fs from "fs";
import zlib from "zlib";
import { Readable } from "stream";

// Directory to store the downloaded and extracted files
const distDir = "./dist";
// Create the directory if it does not exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Function to download and extract a .gz file
// Downloads a .gz file from the specified URL, decompresses it, 
// and saves it to the output path.
export async function downloadAndExtractGzip(url: string, outputFilePath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`\nDownloading and extracting GZ file...`);

      // Make a GET request to the URL to download the .gz file as a stream
      const response = await axios.get(url, { responseType: "stream" });

      // Create a Gunzip stream for decompression
      const gunzip = zlib.createGunzip();

      // Create a write stream to the output file path
      const writeStream = fs.createWriteStream(outputFilePath);

      // Get the data stream from the response
      const data = response.data as Readable;

      // Pipe the data from the GZ file into the gunzip stream to decompress it, 
      data.pipe(gunzip).pipe(writeStream);

      // Once the writing is finished, log success and resolve the promise
      writeStream.on("finish", () => {
        console.log(`CSV file downloaded and decompressed successfully!`);
        resolve();
      });

      // If there is an error during the writing process, log the error and reject the promise
      writeStream.on("error", (err) => {
        console.error("Error during decompressed file writing:", err);
        reject(err);
      });
    } catch (error) {
      // Catch and log any errors that occur during download or extraction
      console.error("Error during .gz file download or extraction:", error);
      reject(error);
    }
  });
}