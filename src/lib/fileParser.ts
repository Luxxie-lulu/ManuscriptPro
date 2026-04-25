import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Define types for PDF.js since we might not have them installed
interface PDFPage {
  getTextContent: () => Promise<{ items: { str: string }[] }>;
}
interface PDFDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPage>;
}

// Global worker setup for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'docx':
      return parseDocx(file);
    case 'pdf':
      return parsePdf(file);
    case 'txt':
      return parseTxt(file);
    default:
      throw new Error(`Unsupported file format: .${extension}`);
  }
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf: PDFDocument = (await loadingTask.promise) as any;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `<p>${pageText}</p>`;
  }
  
  return fullText;
}

async function parseTxt(file: File): Promise<string> {
  const text = await file.text();
  // Wrap lines in paragraphs
  return text.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line}</p>`).join('');
}
