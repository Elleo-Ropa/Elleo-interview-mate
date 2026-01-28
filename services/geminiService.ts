import { GoogleGenAI } from "@google/genai";
import { InterviewRecord, Question } from '../types';
import { INTERVIEW_STAGES } from '../constants';

// Helper to flatten questions for context
const getAllQuestions = (): Question[] => {
  const questions: Question[] = [];
  INTERVIEW_STAGES.forEach(stage => {
    stage.sections.forEach(section => {
      section.questions.forEach(q => questions.push(q));
    });
  });
  return questions;
};

export const analyzeInterview = async (record: InterviewRecord): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const allQuestions = getAllQuestions();

  // Construct a prompt context
  let context = `Candidate Name: ${record.basicInfo.name}\n`;
  context += `Position: ${record.basicInfo.position}\n`;
  context += `Interview Content:\n\n`;

  let hasContent = false;

  Object.entries(record.answers).forEach(([qId, answer]) => {
    if (!answer.trim()) return;
    const question = allQuestions.find(q => q.id === qId);
    if (question) {
      hasContent = true;
      context += `Q: ${question.text}\n`;
      context += `Checkpoints: ${question.checkpoints.join(', ')}\n`;
      context += `Interviewer Note/Answer: ${answer}\n\n`;
    }
  });

  if (!hasContent) {
    return "No interview notes recorded to analyze.";
  }

  const prompt = `
    You are an expert HR Interviewer for the Elleo Group (a premium food & beverage hospitality group). 
    Analyze the following interview notes for a candidate. 
    
    Please provide a structured summary in Korean (Markdown format):
    1. **핵심 강점 (Key Strengths)**: Highlight positive traits based on the notes.
    2. **우려 사항 (Areas of Concern)**: Highlight any red flags or areas needing improvement.
    3. **조직 적합성 (Cultural Fit)**: Assess alignment with teamwork and organizational values.
    4. **종합 의견 (Overall Recommendation)**: A brief conclusion on whether they seem like a strong candidate (추천 / 보류 / 비추천) and why.
    
    Keep it professional, concise, and objective.
    
    ${context}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the AI assistant.";
  }
};