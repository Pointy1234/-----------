import express from 'express';
import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import { promises as fs } from 'fs';
import * as docx from 'docx-parser';  // Обратите внимание, используем полный импорт
import path from 'path';

const app = express();
app.use(express.json());

app.post('/process-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await fetch(url);

        if (response.status === 404) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!response.ok) {
            return res.status(500).json({ error: 'Failed to fetch file from URL' });
        }

        const contentType = response.headers.get('Content-Type');
        const buffer = await response.buffer();

        if (contentType.includes('application/pdf')) {
            // Обработка PDF файла
            const data = await pdfParse(buffer);
            return res.json({ page_count: data.numpages });
        } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
            // Обработка DOCX файла
            const tempFilePath = path.join(__dirname, 'temp.docx');
            await fs.writeFile(tempFilePath, buffer);

            const doc = await docx.parse(tempFilePath);

            // Удаление временного файла
            await fs.unlink(tempFilePath);

            return res.json({ page_count: doc.pageCount });
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
    } catch (error) {
        console.error('Error fetching or processing file:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
