import express from 'express';
import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import { Document, Packer } from 'docx';
import { URL } from 'url';

const app = express();
app.use(express.json());

app.post('/process-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Проверка и загрузка файла
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch file from URL. Status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');

        // Обработка PDF файла
        if (contentType.includes('pdf')) {
            const buffer = await response.buffer();
            const data = await pdf(buffer);
            return res.json({ page_count: data.numpages });
        }

        // Обработка DOCX файла
        if (contentType.includes('docx')) {
            const buffer = await response.buffer();
            const doc = await Document.load(buffer);
            const pages = doc.sections.map(section => section.properties.pageCount || 0);
            return res.json({ page_count: pages.reduce((acc, count) => acc + count, 0) });
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
