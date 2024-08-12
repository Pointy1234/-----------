import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import url from 'url';
import pdf from 'pdf-parse';
import { Document, Packer } from 'docx';

// Получаем текущий каталог
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

async function fetchFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL. Status: ${response.status}`);
  }

  // Используем arrayBuffer вместо buffer
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getPageCount(fileBuffer, fileType) {
  if (fileType === 'application/pdf') {
    const data = await pdf(fileBuffer);
    return data.numpages;
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const doc = new Document(fileBuffer);
    return doc.pageCount;
  } else {
    throw new Error('Unsupported file type');
  }
}

app.post('/process-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const fileBuffer = await fetchFile(url);
    const fileType = 'application/pdf'; // You need to determine this based on the URL or content
    const pageCount = await getPageCount(fileBuffer, fileType);

    res.json({ page_count: pageCount });

    // Очистите временные файлы после обработки (если вы их сохраняете)
    // fs.unlinkSync(filePath);

  } catch (error) {
    console.error('Error fetching or processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
