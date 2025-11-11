import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setOutputVariable,
  writeLog,
  writeVerbose,
  writeInfo,
  writeWarning,
  writeError,
  writeHighlight,
  writeWait,
  updateProgress,
  LogLevel,
} from "../src/octopus-service-messages";

describe("octopus-service-messages", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("setOutputVariable", () => {
    it("should set a non-sensitive output variable", () => {
      setOutputVariable("MyVar", "MyValue");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/##octopus\[setVariable name='.*' value='.*'\]/)
      );

      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain("##octopus[setVariable");
      expect(call).toContain("name=");
      expect(call).toContain("value=");
      expect(call).not.toContain("sensitive");
    });

    it("should set a sensitive output variable", () => {
      setOutputVariable("SecretKey", "secret-value", true);

      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain("##octopus[setVariable");
      expect(call).toContain("name=");
      expect(call).toContain("value=");
      expect(call).toContain("sensitive=");
    });

    it("should base64 encode the variable name and value", () => {
      setOutputVariable("TestVar", "TestValue");

      const call = consoleLogSpy.mock.calls[0][0] as string;

      // Extract base64 values from the service message
      const nameMatch = call.match(/name='([^']+)'/);
      const valueMatch = call.match(/value='([^']+)'/);

      expect(nameMatch).toBeTruthy();
      expect(valueMatch).toBeTruthy();

      // Decode and verify
      const decodedName = Buffer.from(nameMatch![1], "base64").toString("utf8");
      const decodedValue = Buffer.from(valueMatch![1], "base64").toString(
        "utf8"
      );

      expect(decodedName).toBe("TestVar");
      expect(decodedValue).toBe("TestValue");
    });

    it("should handle special characters in variable values", () => {
      setOutputVariable("Special", "Value with spaces and\nnewlines");

      const call = consoleLogSpy.mock.calls[0][0] as string;
      const valueMatch = call.match(/value='([^']+)'/);
      const decodedValue = Buffer.from(valueMatch![1], "base64").toString(
        "utf8"
      );

      expect(decodedValue).toBe("Value with spaces and\nnewlines");
    });
  });

  describe("writeLog", () => {
    it("should write an info message by default", () => {
      writeLog("Test message");

      expect(consoleLogSpy).toHaveBeenCalledWith("Test message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it("should write a verbose message", () => {
      writeLog("Verbose message", LogLevel.Verbose);

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-verbose]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Verbose message");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("should write a warning message", () => {
      writeLog("Warning message", LogLevel.Warning);

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-warning]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Warning message");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("should write an error message", () => {
      writeLog("Error message", LogLevel.Error);

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-error]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Error message");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("should write a highlight message", () => {
      writeLog("Highlight message", LogLevel.Highlight);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/##octopus\[stdout-highlight.*\]/)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("Highlight message");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("should write a wait message", () => {
      writeLog("Wait message", LogLevel.Wait);

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-wait]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Wait message");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });
  });

  describe("convenience logging functions", () => {
    it("writeVerbose should write a verbose message", () => {
      writeVerbose("Verbose");

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-verbose]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Verbose");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("writeInfo should write an info message", () => {
      writeInfo("Info");

      expect(consoleLogSpy).toHaveBeenCalledWith("Info");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it("writeWarning should write a warning message", () => {
      writeWarning("Warning");

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-warning]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Warning");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("writeError should write an error message", () => {
      writeError("Error");

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-error]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Error");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("writeHighlight should write a highlight message", () => {
      writeHighlight("Highlight");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/##octopus\[stdout-highlight.*\]/)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith("Highlight");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });

    it("writeWait should write a wait message", () => {
      writeWait("Wait");

      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-wait]");
      expect(consoleLogSpy).toHaveBeenCalledWith("Wait");
      expect(consoleLogSpy).toHaveBeenCalledWith("##octopus[stdout-default]");
    });
  });

  describe("updateProgress", () => {
    it("should update progress with percentage only", () => {
      updateProgress(50);

      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain("##octopus[progress");
      expect(call).toContain("percentage=");
      expect(call).not.toContain("message=");
    });

    it("should update progress with percentage and message", () => {
      updateProgress(75, "Almost there!");

      const call = consoleLogSpy.mock.calls[0][0] as string;
      expect(call).toContain("##octopus[progress");
      expect(call).toContain("percentage=");
      expect(call).toContain("message=");
    });

    it("should base64 encode the percentage and message", () => {
      updateProgress(100, "Complete!");

      const call = consoleLogSpy.mock.calls[0][0] as string;

      const percentageMatch = call.match(/percentage='([^']+)'/);
      const messageMatch = call.match(/message='([^']+)'/);

      expect(percentageMatch).toBeTruthy();
      expect(messageMatch).toBeTruthy();

      const decodedPercentage = Buffer.from(
        percentageMatch![1],
        "base64"
      ).toString("utf8");
      const decodedMessage = Buffer.from(messageMatch![1], "base64").toString(
        "utf8"
      );

      expect(decodedPercentage).toBe("100");
      expect(decodedMessage).toBe("Complete!");
    });
  });

  describe("highlight with markdown", () => {
    it("should support markdown in highlight messages", () => {
      const markdownMessage = "Click [here](https://octopus.com) for more info";
      writeHighlight(markdownMessage);

      expect(consoleLogSpy).toHaveBeenCalledWith(markdownMessage);
    });
  });
});
