import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors"; // Import cors

// Load environment variables
dotenv.config();
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API Key. Please set it in .env.");
}

const app = express();

// Use CORS middleware
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

const openAIClient = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-description", async (req, res) => {
  const { word1, word2 } = req.body;
  if (
    !word1 ||
    typeof word1 !== "string" ||
    !word2 ||
    typeof word2 !== "string"
  ) {
    return res
      .status(400)
      .send("Invalid words. Both words must be non-empty strings.");
  }

  const prompt = `
  Create short descriptions of "${word1}" and "${word2}".  Format the output as: "description of ${word1} | description of ${word2}". (Each description CAN NOT include the word itself and any other irrelevant symbols.)
  `;

  try {
    const chatCompletion = await openAIClient.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const response = chatCompletion.choices[0].message.content;
    const [description1, description2] = response
      .split("|")
      .map((part) => part.trim());

    res.json({ description1, description2 });
  } catch (error) {
    console.error("Error generating descriptions:", error.message);
    res.status(500).send("Error generating descriptions.");
  }
});

const PORT = 3500;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
