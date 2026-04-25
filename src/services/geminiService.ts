import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AISuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  type: 'phrasing' | 'continuity' | 'character' | 'style';
}

export async function getWritingSuggestions(text: string, context: string): Promise<AISuggestion[]> {
  const prompt = `
    You are a professional book editor. Analyze the following excerpt from a novel manuscript.
    Context of the chapter: ${context}
    
    Excerpt:
    "${text}"
    
    Provide 3-5 specific suggestions for improving this text. 
    Focus on alternative phrasing, plot continuity, character consistency, and prose style.
    
    Return the response ONLY as a JSON array of objects with the following schema:
    [{ "originalText": "string", "suggestedText": "string", "explanation": "string", "type": "phrasing|continuity|character|style" }]
    
    Ensure the "originalText" exactly matches a substring from the excerpt provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text.trim();
    const suggestions = JSON.parse(jsonStr);
    
    return suggestions.map((s: any) => ({
      ...s,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
}

export async function scanContentWarnings(chapters: { title: string, content: string }[]): Promise<string[]> {
  const fullText = chapters.map(c => `Chapter: ${c.title}\n${c.content}`).join('\n\n');
  const prompt = `
    Analyze the following book manuscript for potentially sensitive themes or content warnings (e.g., violence, language, adult themes).
    List any significant themes that a reader might want to know about beforehand.
    
    Return the response ONLY as a JSON array of strings.
    Example: ["Graphic Violence", "Strong Language", "Mental Health Themes"]
    
    Manuscript:
    ${fullText.substring(0, 15000)} // Limit to fit tokens if necessary
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Warning Scan Error:", error);
    return [];
  }
}

export async function generateAuthorsNoteDraft(authorName: string, bookTitle: string, themeSummary: string): Promise<string> {
  const prompt = `
    Compose a professional and heartfelt Author's Note for a novel.
    Author: ${authorName}
    Book Title: ${bookTitle}
    Themes/Intent: ${themeSummary}
    
    The note should thank the reader, briefly touch on why this story was written, and bridge the gap between author and reader.
    Return ONLY the text of the author's note.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    console.error("AI Author Note Error:", error);
    return "Error generating author's note.";
  }
}

export async function generateBookCover(title: string, author: string, genre: string, prompt: string): Promise<string[]> {
  const imagePrompt = `Book cover for "${title}" by ${author}. Genre: ${genre}. ${prompt}. Minimalist, elegant, high quality, professional book design. No text on the image, just the background art.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    const imageUrls: string[] = [];
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrls.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
      }
    }
    return imageUrls;
  } catch (error) {
    console.error("AI Cover Generation Error:", error);
    return [];
  }
}
