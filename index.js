import express from 'express';
import fetch from 'node-fetch';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/count-pages', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file from URL. Status: ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        const ext = path.extname(url);

        if (ext === '.pdf') {
            // Обработка PDF
            const data = await pdfParse(buffer);
            res.json({ pages: data.numpages });
        } else if (ext === '.docx') {
            // Сохранение файла и его обработка
            const filePath = path.join(__dirname, 'temp', 'tempfile.docx');
            fs.writeFileSync(filePath, buffer);
            
            const result = await mammoth.extractRawText({ path: filePath });
            fs.unlinkSync(filePath); // Удаление файла после обработки

            // Примерный подсчёт страниц на основе количества символов
            const pageCount = Math.ceil(result.value.length / 1800);
            res.json({ pages: pageCount });
        } else {
            res.status(400).json({ error: 'Unsupported file format' });
        }
    } catch (error) {
        console.error('Error fetching or processing file:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
