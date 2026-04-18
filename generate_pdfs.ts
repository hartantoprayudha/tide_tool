import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createRef(filename: string, title: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(title, { x: 50, y: 700, size: 20, font });
  page.drawText('This is a reference document for BIG Tidal Analysis.', { x: 50, y: 650, size: 12, font });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filename, pdfBytes);
}

async function run() {
  const dir = path.join(process.cwd(), 'public', 'References');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await createRef(path.join(dir, 'Moving_Average_Method.pdf'), 'Moving Average for Tide Filtering');
  await createRef(path.join(dir, 'Median_Filter_Method.pdf'), 'Median Filtering for Outlier Removal');
  await createRef(path.join(dir, 'Butterworth_Filter_Method.pdf'), 'Low-Pass Butterworth Filter in Oceanography');
  console.log('PDFs created successfully.');
}
run();
