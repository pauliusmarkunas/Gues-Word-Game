import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors"; // Import cors

// Load environment variables
dotenv.config();

const app = express();

// Use CORS middleware
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

const openAIClient = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-word", async (req, res) => {
  const { levelStats } = req.body;
  if (
    !levelStats ||
    typeof levelStats[2] !== "number" ||
    typeof levelStats[3] !== "number"
  ) {
    return res.status(400).send("Invalid levelStats data.");
  }

  const prompt = `Generate an English word and a concise description for a word guessing game. Ensure the following:

- Difficulty: Level ${levelStats[2]} (1 = Easy, 5 = Hard)
- Word Length: ${levelStats[3]} characters
- Format: 'word' | 'description' (no prefixes or labels)
- The description must not include the word.

Example: exotic | Foreign; strikingly unusual or strange`;

  try {
    const chatCompletion = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const response = chatCompletion.choices[0].message.content;
    const [word, description] = response.split("|").map((part) => part.trim());

    res.json({ word, description });
  } catch (error) {
    console.error("Error generating word:", error.message);
    res.status(500).send("Error generating word.");
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
