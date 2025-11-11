/**
 * Utility functions for sending service messages to Octopus Deploy.
 * These functions allow scripts to interact with Octopus Deploy during execution,
 * such as setting output variables and logging messages at different levels.
 */

/**
 * Encodes a value for use in Octopus service messages.
 * Values are base64-encoded to handle special characters and newlines.
 */
function encodeServiceMessageValue(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

/**
 * Writes a service message to stdout that Octopus will parse.
 */
function writeServiceMessage(
  messageName: string,
  properties: Record<string, string>
): void {
  const propertyPairs = Object.entries(properties)
    .map(([key, value]) => `${key}='${value}'`)
    .join(" ");
  console.log(`##octopus[${messageName} ${propertyPairs}]`);
}

/**
 * Sets an output variable in Octopus Deploy.
 * Output variables can be used in subsequent deployment steps.
 *
 * @param name - The name of the output variable
 * @param value - The value to set
 * @param sensitive - Whether the variable contains sensitive data (default: false)
 *
 * @example
 * setOutputVariable("DatabaseConnectionString", "Server=myserver;Database=mydb");
 * setOutputVariable("ApiKey", "secret-key-123", true);
 */
export function setOutputVariable(
  name: string,
  value: string,
  sensitive: boolean = false
): void {
  const properties: Record<string, string> = {
    name: encodeServiceMessageValue(name),
    value: encodeServiceMessageValue(value),
  };

  if (sensitive) {
    properties.sensitive = encodeServiceMessageValue("true");
  }

  writeServiceMessage("setVariable", properties);
}

/**
 * Log level for Octopus Deploy messages.
 */
export enum LogLevel {
  /** Verbose messages (hidden by default in task logs) */
  Verbose = "verbose",
  /** Informational messages */
  Info = "info",
  /** Warning messages */
  Warning = "warning",
  /** Error messages */
  Error = "error",
  /** Highlighted messages (shown in bold and blue, appear in task summary) */
  Highlight = "highlight",
  /** Wait messages (indicate deployment is waiting for something) */
  Wait = "wait",
}

/**
 * Writes a message to the Octopus Deploy task log at the specified level.
 *
 * @param message - The message to log
 * @param level - The log level (default: Info)
 *
 * @example
 * writeLog("Starting deployment process");
 * writeLog("Configuration file not found", LogLevel.Warning);
 * writeLog("Deployment failed", LogLevel.Error);
 */
export function writeLog(
  message: string,
  level: LogLevel = LogLevel.Info
): void {
  switch (level) {
    case LogLevel.Verbose:
      // In Node.js/TypeScript, we need to use console.log with service messages
      // since there's no direct equivalent to Write-Verbose
      console.log(`##octopus[stdout-verbose]`);
      console.log(message);
      console.log(`##octopus[stdout-default]`);
      break;
    case LogLevel.Warning:
      console.log(`##octopus[stdout-warning]`);
      console.log(message);
      console.log(`##octopus[stdout-default]`);
      break;
    case LogLevel.Error:
      console.log(`##octopus[stdout-error]`);
      console.log(message);
      console.log(`##octopus[stdout-default]`);
      break;
    case LogLevel.Highlight:
      writeServiceMessage("stdout-highlight", {});
      console.log(message);
      console.log(`##octopus[stdout-default]`);
      break;
    case LogLevel.Wait:
      console.log(`##octopus[stdout-wait]`);
      console.log(message);
      console.log(`##octopus[stdout-default]`);
      break;
    case LogLevel.Info:
    default:
      console.log(message);
      break;
  }
}

/**
 * Writes a verbose message (hidden by default in task logs).
 * Shorthand for writeLog(message, LogLevel.Verbose).
 */
export function writeVerbose(message: string): void {
  writeLog(message, LogLevel.Verbose);
}

/**
 * Writes an informational message.
 * Shorthand for writeLog(message, LogLevel.Info).
 */
export function writeInfo(message: string): void {
  writeLog(message, LogLevel.Info);
}

/**
 * Writes a warning message.
 * Shorthand for writeLog(message, LogLevel.Warning).
 */
export function writeWarning(message: string): void {
  writeLog(message, LogLevel.Warning);
}

/**
 * Writes an error message.
 * Shorthand for writeLog(message, LogLevel.Error).
 */
export function writeError(message: string): void {
  writeLog(message, LogLevel.Error);
}

/**
 * Writes a highlighted message (shown in bold and blue, appears in task summary).
 * Supports Markdown for hyperlinks.
 * Shorthand for writeLog(message, LogLevel.Highlight).
 *
 * @example
 * writeHighlight("Deployment completed successfully!");
 * writeHighlight("Click [here](https://myapp.example.com) to view the application");
 */
export function writeHighlight(message: string): void {
  writeLog(message, LogLevel.Highlight);
}

/**
 * Writes a wait message (indicates deployment is waiting for something).
 * Shorthand for writeLog(message, LogLevel.Wait).
 */
export function writeWait(message: string): void {
  writeLog(message, LogLevel.Wait);
}

/**
 * Updates the progress bar in the Octopus Deploy task log.
 *
 * @param percentage - The percentage complete (0-100)
 * @param message - Optional message to display with the progress bar
 *
 * @example
 * updateProgress(25, "Processing files...");
 * updateProgress(100, "Complete!");
 */
export function updateProgress(percentage: number, message?: string): void {
  const properties: Record<string, string> = {
    percentage: encodeServiceMessageValue(percentage.toString()),
  };

  if (message) {
    properties.message = encodeServiceMessageValue(message);
  }

  writeServiceMessage("progress", properties);
}
