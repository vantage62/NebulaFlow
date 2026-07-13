export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF(file);
  } else {
    // For text, markdown, etc.
    return await file.text();
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to avoid SSR crashes in Next.js
  const pdfjsLib = await import('pdfjs-dist');
  
  if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  
  // Use getDocument to parse the PDF
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Extract strings and join them
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
      
    fullText += pageText + '\n\n';
  }
  
  return fullText;
}
