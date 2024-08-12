import express from 'express';
import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';
import * as docx from 'docx';

const app = express();
app.use(express.json());

app.post('/process-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Загрузка файла
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch file from URL. Status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');

        // Обработка PDF файла
        if (contentType.includes('pdf')) {
            const buffer = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);
            const pageCount = pdfDoc.getPageCount();
            return res.json({ page_count: pageCount });
        }

        // Обработка DOCX файла
        if (contentType.includes('docx')) {
            const buffer = await response.arrayBuffer();
            const doc = await docx.Packer.toDocument(buffer);
            const pageCount = doc.sections.reduce((count, section) => count + (section.properties?.pageCount || 0), 0);
            return res.json({ page_count: pageCount });
        }

        return res.status(415).json({ error: 'Unsupported file type' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
