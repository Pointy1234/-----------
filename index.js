import express from 'express';
import { PDFDocument } from 'pdf-lib';
import docx from 'docx';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/process-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch file from URL. Status: ${response.status}` });
        }

        const contentType = response.headers.get('Content-Type');
        const buffer = await response.buffer();

        if (contentType.includes('pdf')) {
            const pdfDoc = await PDFDocument.load(buffer);
            const pageCount = pdfDoc.getPageCount();
            return res.json({ page_count: pageCount });
        } else if (contentType.includes('docx')) {
            const doc = new docx.Document(buffer);
            const pageCount = doc.sections.length; // Пример подсчета страниц
            return res.json({ page_count: pageCount });
        } else {
            return res.status(415).json({ error: 'Unsupported file type' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error processing the URL', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
