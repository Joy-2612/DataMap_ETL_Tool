// services/aiService.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper services
const {
  getHeadersService,
  getFirst10RowsService,
  getDistinctValuesService,
} = require("./aiFIleService");

const {
  mergeDatasetsService,
  concatenateColumnsService,
  splitColsService,
  standardizeColumnService,
} = require("../services/fileService");

const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);

// Define Gemini model
const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

/**
 * runChainOfThought
 * Orchestrates the conversation with Gemini and streams thoughts and final answers.
 */
async function runChainOfThought(userPrompt, chatHistory, onUpdate) {
  console.log("User Prompt:", userPrompt);

  // Read system instructions from an XML file
  const systemInstructions = fs.readFileSync(
    path.join(__dirname, "prompt.xml"),
    "utf-8"
  );

  try {
    // Convert database format to Gemini's chat history format
    const formattedHistory = chatHistory.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Start chat session with history and system instructions
    const chatSession = geminiModel.startChat({
      history: formattedHistory,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstructions }],
      },
    });

    let response = await chatSession.sendMessage(userPrompt);
    let responseText = response.response.text();
    let maxIterations = 10;

    while (maxIterations-- > 0) {
      const parsed = parseResponse(responseText);

      // Stream thoughts
      if (parsed.thought) {
        onUpdate("thought", { thought: parsed.thought });
      }

      // Final answer
      if (parsed.answer) {
        onUpdate("answer", { answer: parsed.answer });
        return;
      }

      // Handle actions
      if (parsed.action) {
        const observation = await handleAction(parsed.action);
        onUpdate("observation", { observation });

        // Send observation back to continue conversation
        response = await chatSession.sendMessage(
          `<observation>${observation}</observation>`
        );
        responseText = response.response.text();
      } else {
        break;
      }
    }

    if (maxIterations <= 0) {
      onUpdate("error", {
        error: "Maximum iterations reached without resolution",
      });
    }
  } catch (error) {
    console.error("Error in chat session:", error);
    onUpdate("error", { error: error.message });
  }
}

// Helper function to parse LLM response
function parseResponse(responseText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  try {
    const parsed = parser.parse(responseText);
    return {
      thought: parsed.steps?.thought,
      action: parsed.steps?.action,
      answer: parsed.answer || parsed.steps?.answer,
    };
  } catch (error) {
    console.error("Error parsing response:", error);
    return { error: "Invalid response format from AI" };
  }
}
/**
 * callGeminiLLM
 * Sends the conversation to Gemini and returns its response.
 */
async function callGeminiLLM(conversation) {
  try {
    const prompt = conversation.map((msg) => msg.content).join("\n");
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response?.text();
    if (!responseText) {
      return "Thought: [No valid response from Gemini]\n";
    }
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini LLM:", error);
    return "Thought: I'm sorry, but I encountered an error calling the Gemini LLM.\n";
  }
}

/**
 * handleAction
 * Executes the action parsed from the LLM response.
 */
async function handleAction(actionString) {
  console.log("actionString:", actionString);

  const funcName = actionString.name;
  const parameters = actionString.parameters;

  if (!funcName || !parameters) {
    return "Invalid action format";
  }

  const args = Object.values(parameters);

  switch (funcName) {
    case "get_headers":
      if (args.length < 1) return "File ID required for get_headers";
      return await getHeadersService(args[0]);

    case "get_first_10_rows":
      if (args.length < 1) return "File ID required for get_first_10_rows";
      return await getFirst10RowsService(args[0]);

    case "get_distinct_value_of_column":
      if (args.length < 2)
        return "File ID and columnName required for get_distinct_value_of_column";
      return await getDistinctValuesService(args[0], args[1]);

    case "merge":
      const [
        dataset1,
        dataset2,
        column1,
        column2,
        outputFileName,
        description,
      ] = args;
      try {
        const newFile = await mergeDatasetsService({
          dataset1,
          dataset2,
          column1,
          column2,
          outputFileName: outputFileName || "merged.csv",
          description: description || "",
        });
        return `Operation done successfully! fileId:${newFile._id}`;
      } catch (err) {
        return `Error merging: ${err.message}`;
      }

    case "concatenate":
      const [
        dataset,
        columnsStr,
        finalColumnName,
        delimiter,
        outputFileNameConcat,
        descriptionConcat,
      ] = args;
      const columns = columnsStr.split("|").map((c) => c.trim());
      try {
        const newFile = await concatenateColumnsService({
          dataset,
          columns,
          finalColumnName,
          delimiter,
          outputFileName: outputFileNameConcat,
          description: descriptionConcat,
        });
        return `Operation done successfully! fileId:${newFile._id}`;
      } catch (err) {
        return `Error concatenating: ${err.message}`;
      }

    case "split":
      const [fileId, splitsJson, outputFileNameSplit, descriptionSplit] = args;
      let parsedSplits;
      try {
        parsedSplits = JSON.parse(splitsJson);
      } catch (err) {
        return "Invalid splits JSON format. Provide a valid JSON for splits.";
      }
      try {
        const newFile = await splitColsService({
          fileId,
          splits: parsedSplits,
          outputFileName: outputFileNameSplit,
          description: descriptionSplit,
        });
        return `Operation done successfully! fileId:${newFile._id}`;
      } catch (err) {
        return `Error splitting: ${err.message}`;
      }

    case "standardize":
      const [
        datasetId,
        column,
        mappingsJson,
        outputFileNameStd,
        descriptionStd,
      ] = args;
      let parsedMappings;
      try {
        const rawMappings = JSON.parse(mappingsJson);
        parsedMappings = Object.entries(rawMappings).reduce(
          (acc, [key, value]) => {
            const existingMapping = acc.find(
              (mapping) => mapping.after === value
            );
            if (existingMapping) {
              existingMapping.before.push(key);
            } else {
              acc.push({ before: [key], after: value });
            }
            return acc;
          },
          []
        );
      } catch (err) {
        return "Invalid mappings JSON. Provide valid JSON for 'mappings'.";
      }
      try {
        const newFile = await standardizeColumnService({
          datasetId,
          column,
          mappings: parsedMappings,
          outputFileName: outputFileNameStd || "standardized.csv",
          description: descriptionStd || "",
        });
        return `Operation done successfully! fileId:${newFile._id}`;
      } catch (err) {
        return `Error standardizing: ${err.message}`;
      }

    default:
      return `Unknown action: ${funcName}`;
  }
}

module.exports = {
  runChainOfThought,
};
