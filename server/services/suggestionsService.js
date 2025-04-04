require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const {
  getHeadersService,
  getFirst10RowsService,
  getDistinctValuesService,
} = require("./aiFIleService");

const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiModel = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const handleAction = async (actionString) => {
  const { name: funcName, parameters } = actionString;
  if (!funcName || !parameters) return "Invalid action format";
  const args = Object.values(parameters);

  console.log("Function name:", funcName);
  console.log("Arguments:", args);

  switch (funcName) {
    case "get_headers":
      return args.length < 1
        ? "File ID required for get_headers"
        : await getHeadersService(args[0].value);
    case "get_first_10_rows":
      return args.length < 1
        ? "File ID required for get_first_10_rows"
        : await getFirst10RowsService(args[0].value);
    case "get_distinct_value_of_column":
      return args.length < 2
        ? "File ID and columnName required for get_distinct_value_of_column"
        : await getDistinctValuesService(args[0].value, args[1].value);
    default:
      return `Unknown action: ${funcName}`;
  }
};

const parseResponse = async (responseText) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  try {
    const parsed = parser.parse(responseText);
    let suggestions = parsed.suggestions || parsed.steps?.suggestions;
    if (suggestions && !Array.isArray(suggestions)) {
      suggestions = Object.values(suggestions);
    }
    return {
      thought: parsed.steps?.thought,
      action: parsed.steps?.action,
      suggestions,
    };
  } catch (error) {
    console.error("Error parsing response:", error);
    return { error: "Invalid response format from AI" };
  }
};

const runInLoop = async (fileId, onUpdate) => {
  console.log("Running in loop with fileId:", fileId);
  const systemInstructions = fs.readFileSync(
    path.join(__dirname, "suggestionPrompt.xml"),
    "utf-8"
  );

  try {
    const chatSession = geminiModel.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstructions }, { text: "Generate XML only!" }],
      },
    });

    let response = await chatSession.sendMessage(fileId);
    let responseText = await response.response.text();

    let maxIterations = 10;

    while (maxIterations-- > 0) {
      const parsed = await parseResponse(responseText);
      console.log("Response text:", responseText);
      if (parsed.thought) onUpdate("thought", { thought: parsed.thought });
      if (parsed.suggestions) {
        onUpdate("suggestions", { suggestions: parsed.suggestions });
        return;
      }
      if (parsed.action) {
        const observation = await handleAction(parsed.action);
        onUpdate("observation", { observation });
        response = await chatSession.sendMessage(
          `<observation>${observation}</observation>`
        );
        responseText = await response.response.text();
      } else {
        break;
      }
    }

    if (maxIterations <= 0)
      onUpdate("error", {
        error: "Maximum iterations reached without resolution",
      });
  } catch (error) {
    console.error("Error in chat session:", error);
    onUpdate("error", { error: error.message });
  }
};

module.exports = { runInLoop };
