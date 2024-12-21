import express from "express";
import fs from "fs";
import cors from "cors";
import inquirer from "inquirer";
import { randomizeDataRoute } from "./randomizer";
import { AppDataSource } from './data-source';
import { RequestLog } from './entities/RequestLog';

// Initialize Express
const app = express();
const port = 3000;

// CORS configuration
app.use(cors());
app.use(express.json());

// Directory to store files after extraction
const distDir = "./dist";
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Function to clear the request_log table if the user chooses to
async function clearRequestLogTable(): Promise<void> {
  // Ask the user if they want to clear the request_log table
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'clearTable',
      message: '\nDo you want to clear the "request_log" table?',
      default: false,
    },
  ]);

  if (answers.clearTable) {
    try {
      // If the user answers 'yes', clear the table
      await AppDataSource.getRepository(RequestLog).clear();
      console.log("Table 'request_log' has been cleared.");
    } catch (error) {
      console.error("Error clearing the 'request_log' table:", error);
    }
  } else {
    console.log("The 'request_log' table was not modified.");
  }
}

// Function to start the server
async function startServer() {
  try {
    // Initialize the connection to the database
    await AppDataSource.initialize();
    console.log("Database connected!");

    // Ask the user if they want to clear the request_log table
    await clearRequestLogTable();

    // If you have migrations, you can run them here
    await AppDataSource.runMigrations();
    console.log("Database migrations applied successfully!\n");

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

// Import routes
import { downloadExtractRoute, downloadRoute, checkFileRoute } from "./utils";

// Set up routes
app.use("/download-extract", downloadExtractRoute);
app.use("/download", downloadRoute);
app.use("/check-file", checkFileRoute);
app.post("/randomize-data", randomizeDataRoute);

// Call the startServer function to initialize the server
startServer();
