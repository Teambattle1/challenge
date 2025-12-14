import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

// The immediate check for process.env.API_KEY was causing a startup crash.
// This has been modified to initialize `ai` conditionally, preventing the crash
// while preserving the file's functionality if it were to be used later.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      questionText: {
        type: Type.STRING,
        description: "The text of the quiz question.",
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 4 possible answers.",
      },
      correctAnswerIndex: {
        type: Type.INTEGER,
        description: "The 0-based index of the correct answer in the 'options' array.",
      },
    },
    required: ["questionText", "options", "correctAnswerIndex"],
  },
};

export const generateLocationQuiz = async (location: string): Promise<Question[]> => {
  if (!ai) {
    console.error("Gemini API key not configured. Cannot generate quiz.");
    throw new Error("The Gemini AI service is not configured.");
  }
  
  try {
    const prompt = `Generate a 10-question multiple-choice quiz about the location: ${location}. 
    The questions should be interesting and cover topics like history, landmarks, culture, and fun facts. 
    Each question must have exactly 4 plausible options, with only one being correct.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });
    
    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No content generated");
    }

    const quizData = JSON.parse(jsonText.trim()) as Question[];

    // Basic validation
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("AI returned invalid quiz data format.");
    }
    quizData.forEach(q => {
        if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswerIndex !== 'number') {
           throw new Error("Invalid question structure in AI response.");
        }
    });

    return quizData;
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    throw error;
  }
};
