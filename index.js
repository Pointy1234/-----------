const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');

const app = express();
app.use(express.json());

app.post('/processUrl', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await fetch(url);
        const buffer = await response.buffer();

        const contentType = response.headers.get('content-type');
        let pageCount = 0;

        if (contentType === 'application/pdf') {
            const pdfDoc = await PDFDocument.load(buffer);
            pageCount = pdfDoc.getPageCount();
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: buffer });
            const text = result.value;
            pageCount = Math.ceil(text.split('\n').length / 50); // Примерная оценка страниц
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        res.json({
            result: {
                pageCount: pageCount
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error processing the file' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
