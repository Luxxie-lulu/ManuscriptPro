import { jsPDF } from 'jspdf';

export interface ManuscriptOptions {
  authorName: string;
  bookTitle: string;
  fontSize: number;
  lineSpacing: number;
  marginSize: number; // in inches
  fontFamily: 'times' | 'courier' | 'helvetica';
  paragraphStyle: 'indented' | 'block';
  justification: 'left' | 'justify';
  includeTOC: boolean;
  widowsOrphans: boolean;
  spacingBefore: number; // in pt
  spacingAfter: number; // in pt
  numberingFormat: 'none' | 'arabic' | 'roman' | 'words';
  contentWarnings: string[];
  authorsNote: string;
  includeWarningsPage: boolean;
  includeAuthorsNote: boolean;
  coverUrl?: string;
}

function formatChapterNumber(n: number, format: ManuscriptOptions['numberingFormat']): string {
  if (format === 'none') return '';
  if (format === 'arabic') return n.toString();
  
  if (format === 'roman') {
    const romanMap = [
      { v: 1000, s: 'M' }, { v: 900, s: 'CM' }, { v: 500, s: 'D' }, { v: 400, s: 'CD' },
      { v: 100, s: 'C' }, { v: 90, s: 'XC' }, { v: 50, s: 'L' }, { v: 40, s: 'XL' },
      { v: 10, s: 'X' }, { v: 9, s: 'IX' }, { v: 5, s: 'V' }, { v: 4, s: 'IV' }, { v: 1, s: 'I' }
    ];
    let res = '';
    let num = n;
    for (const { v, s } of romanMap) {
      while (num >= v) {
        res += s;
        num -= v;
      }
    }
    return res;
  }
  
  if (format === 'words') {
    const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    return words[n] || n.toString(); // Fallback for very long books
  }
  
  return n.toString();
}

export async function generateManuscriptPDF(
  chapters: { title: string; content: string }[],
  options: ManuscriptOptions
) {
  const doc = new jsPDF({
    unit: 'in',
    format: 'letter'
  });

  const { 
    authorName, 
    bookTitle, 
    fontSize, 
    lineSpacing, 
    marginSize, 
    fontFamily, 
    justification, 
    paragraphStyle, 
    includeTOC, 
    spacingBefore, 
    spacingAfter, 
    numberingFormat,
    contentWarnings,
    authorsNote,
    includeWarningsPage,
    includeAuthorsNote,
    coverUrl
  } = options;

  const pageWidth = 8.5;
  const pageHeight = 11;
  const printableWidth = pageWidth - (marginSize * 2);
  const startY = marginSize + 0.5;

  let pageNumber = 1;

  // 0. Cover Page
  if (coverUrl) {
    try {
      // Use full page for cover
      doc.addImage(coverUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
      
      // Overlay Title and Author with a slight shadow effect for legibility
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(36);
      doc.text(bookTitle, pageWidth / 2, pageHeight / 3, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(`By ${authorName}`, pageWidth / 2, (pageHeight / 3) + 0.8, { align: 'center' });
      
      doc.setTextColor(0, 0, 0); // Reset for content
      doc.addPage();
      pageNumber++;
    } catch (err) {
      console.error("Cover image added failed:", err);
    }
  }

  // 1. Content Warnings Page
  if (includeWarningsPage && contentWarnings.length > 0) {
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(18);
    doc.text('Content Warnings', pageWidth / 2, marginSize + 1, { align: 'center' });
    
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(12);
    let warnY = marginSize + 2;
    
    contentWarnings.forEach(w => {
      doc.text(`• ${w}`, marginSize, warnY);
      warnY += 0.3;
    });
    
    doc.addPage();
    pageNumber++; // Incremented for the next page (TOC or Chapter 1)
  }

  // 2. TOC Reservation
  if (includeTOC) {
    doc.addPage();
    pageNumber++; // Chapter 1 starts on page after TOC
  }

  const chapterPageMap: { title: string; page: number; displayNumber: string }[] = [];

  chapters.forEach((chapter, index) => {
    // We already handled adding pages for the first chapter if Front Matter exists
    if (index > 0) {
       doc.addPage();
       pageNumber++;
    }

    const displayNumber = formatChapterNumber(index + 1, numberingFormat);
    chapterPageMap.push({ title: chapter.title, page: pageNumber, displayNumber });

    const drawHeader = (pNum: number) => {
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(12);
      const headerText = `${authorName} / ${bookTitle} / ${pNum}`;
      doc.text(headerText, pageWidth - marginSize, marginSize, { align: 'right' });
    };

    drawHeader(pageNumber);

    // Chapter Title
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(fontSize + 6);
    const titleText = numberingFormat !== 'none' 
      ? `Chapter ${displayNumber}: ${chapter.title}` 
      : chapter.title;
    doc.text(titleText, pageWidth / 2, startY, { align: 'center' });

    // Chapter Content
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(fontSize);
    
    // Process HTML 
    const cleanParagraphs = chapter.content
      .split(/<\/p>/)
      .map(p => p.replace(/<p>/g, '').replace(/<[^>]*>?/gm, '').trim())
      .filter(p => p.length > 0);

    let currentY = startY + 0.8;

    cleanParagraphs.forEach((para, pIdx) => {
      currentY += (spacingBefore / 72);

      const textToDraw = (paragraphStyle === 'indented' && pIdx > 0) ? `      ${para}` : para;
      const lines = doc.splitTextToSize(textToDraw, printableWidth);
      
      lines.forEach((line: string) => {
        if (currentY > pageHeight - marginSize) {
          doc.addPage();
          pageNumber++;
          drawHeader(pageNumber);
          currentY = marginSize + 0.5;
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(fontSize);
        }
        
        doc.text(line, marginSize, currentY, { 
          align: justification === 'justify' ? 'justify' : 'left',
          maxWidth: printableWidth
        });
        currentY += (fontSize / 72) * lineSpacing;
      });

      currentY += (spacingAfter / 72);

      if (paragraphStyle === 'block') {
        currentY += (fontSize / 72) * 0.5; // Add extra gap for block style
      }
    });

    // No redundant pageNumber increment here - it's handled at the start of the next chapter loop
  });

  // Generate Table of Contents on the reserved page if requested
  if (includeTOC) {
    const tocPage = includeWarningsPage ? 2 : 1;
    doc.setPage(tocPage);
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(18);
    doc.text('Table of Contents', pageWidth / 2, marginSize + 1, { align: 'center' });
    
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(12);
    let tocY = marginSize + 2;

    chapterPageMap.forEach((item) => {
      const label = item.displayNumber 
        ? `Chapter ${item.displayNumber}: ${item.title}` 
        : item.title;
      const pNumStr = item.page.toString();
      
      const dotsWidth = printableWidth - doc.getTextWidth(label) - doc.getTextWidth(pNumStr);
      const dots = ".".repeat(Math.max(0, Math.floor(dotsWidth / doc.getTextWidth(".")) - 2));

      doc.text(label, marginSize, tocY);
      doc.text(pNumStr, pageWidth - marginSize, tocY, { align: 'right' });
      
      // Draw leader dots manually for clean alignment
      if (dots.length > 0) {
        doc.text(dots, marginSize + doc.getTextWidth(label) + 0.1, tocY);
      }
      
      tocY += 0.4;
    });
  }

  // Author's Note at the end
  if (includeAuthorsNote && authorsNote) {
    doc.addPage();
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(18);
    doc.text("Author's Note", pageWidth / 2, marginSize + 1, { align: 'center' });
    
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(authorsNote, printableWidth);
    doc.text(lines, marginSize, marginSize + 2);
  }

  doc.save(`${bookTitle.replace(/\s+/g, '_')}_Manuscript.pdf`);
}
