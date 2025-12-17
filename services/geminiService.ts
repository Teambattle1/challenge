import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

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
  // Always initialize client using the strict named parameter from process.env.API_KEY
  if (!process.env.API_KEY) {
    throw new Error("Gemini API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `Generate a 10-question multiple-choice quiz about the location: ${location}. 
    The questions should be interesting and cover topics like history, landmarks, culture, and fun facts. 
    Each question must have exactly 4 plausible options, with only one being correct.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });
    
    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("AI returned empty content");
    }

    const quizData = JSON.parse(jsonText.trim()) as Question[];

    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("AI returned invalid quiz data format.");
    }

    return quizData;
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    throw error;
  }
};