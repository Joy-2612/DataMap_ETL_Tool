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
const {
  mergeDatasetsService,
  concatenateColumnsService,
  splitColsService,
  standardizeColumnService,
} = require("../services/fileService");

const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiModel = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function runChainOfThought(userPrompt, chatHistory, onUpdate) {
  console.log("User Prompt:", userPrompt, "Chat History:", chatHistory);
  let fileIds = await getFileIdGemini(chatHistory);
  fileIds = Array.isArray(fileIds) ? fileIds : [];
  const systemInstructions = fs.readFileSync(
    path.join(__dirname, "prompt2.xml"),
    "utf-8"
  );

  try {
    const formattedHistory = chatHistory
      .filter((msg) => msg.text !== undefined)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [
          { text: msg.text },
          { text: `File IDs used for operations: ${fileIds.join(", ")}` },
        ],
      }));

    const chatSession = geminiModel.startChat({
      history: formattedHistory,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstructions }, { text: "Generate XML only!" }],
      },
    });

    let response = await chatSession.sendMessage(userPrompt);
    let responseText = response.response.text();
    let maxIterations = 10;

    while (maxIterations-- > 0) {
      const parsed = parseResponse(responseText);
      if (parsed.thought) onUpdate("thought", { thought: parsed.thought });
      if (parsed.answer) {
        onUpdate("answer", { answer: parsed.answer });
        return;
      }
      if (parsed.action) {
        const observation = await handleAction(parsed.action);
        onUpdate("observation", { observation });
        response = await chatSession.sendMessage(
          `<observation>${observation}</observation>`
        );
        responseText = response.response.text();
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
}

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

async function callGeminiLLM(conversation) {
  try {
    const prompt = conversation.map((msg) => msg.content).join("\n");
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response?.text();
    return responseText || "Thought: [No valid response from Gemini]\n";
  } catch (error) {
    console.error("Error calling Gemini LLM:", error);
    return "Thought: I'm sorry, but I encountered an error calling the Gemini LLM.\n";
  }
}

async function getTitle(messages) {
  const titleSystemInstructions = fs.readFileSync(
    path.join(__dirname, "titlePrompt.xml"),
    "utf-8"
  );
  const formattedHistory = messages.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));
  const prompt = formattedHistory
    .map((msg) => msg.parts.map((part) => part.text).join(" "))
    .join("\n");
  const promptWithInstructions = `${titleSystemInstructions}\n${prompt}`;
  const response = await geminiModel.generateContent(promptWithInstructions);
  return response.response?.text();
}

async function getFileIdGemini(chatHistory) {
  const fileIdSystemInstructions = fs.readFileSync(
    path.join(__dirname, "generateFileId.xml"),
    "utf-8"
  );
  const formattedHistory = chatHistory.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));
  const prompt = formattedHistory
    .map((msg) => msg.parts.map((part) => part.text).join(" "))
    .join("\n");
  const promptWithInstructions = `${fileIdSystemInstructions}\n${prompt}`;
  const response = await geminiModel.generateContent(promptWithInstructions);
  const responseText = response.response?.text();
  if (!responseText) {
    console.error("Empty response from Gemini.");
    return [];
  }
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(responseText);
    return Array.isArray(parsed.fileId) ? parsed.fileId : [parsed.fileId];
  } catch (error) {
    console.error("Error parsing response:", error);
    return [];
  }
}

async function handleAction(actionString) {
  const { name: funcName, parameters } = actionString;
  if (!funcName || !parameters) return "Invalid action format";
  const args = Object.values(parameters);

  switch (funcName) {
    case "get_headers":
      return args.length < 1
        ? "File ID required for get_headers"
        : await getHeadersService(args[0]);

    case "get_first_10_rows":
      return args.length < 1
        ? "File ID required for get_first_10_rows"
        : await getFirst10RowsService(args[0]);

    case "get_distinct_value_of_column":
      return args.length < 2
        ? "File ID and columnName required for get_distinct_value_of_column"
        : await getDistinctValuesService(args[0], args[1]);

    case "merge": {
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
    }

    case "concatenate": {
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
    }

    case "split": {
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
    }

    case "standardize": {
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
            existingMapping
              ? existingMapping.before.push(key)
              : acc.push({ before: [key], after: value });
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
    }

    default:
      return `Unknown action: ${funcName}`;
  }
}

module.exports = { runChainOfThought, getTitle };
