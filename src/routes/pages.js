import express from 'express';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

const router = express.Router();
const temp_dir = path.join(process.cwd(), 'temp');

const get_temp_file_path = (filename) => path.join(temp_dir, filename);

fs.ensureDirSync(temp_dir);

const download_file = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response;
  } catch (error) {
    throw new Error('Failed to download file');
  }
};

const extract_file_details = (content_disposition) => {
  let file_name = 'unknown';
  let file_extension = 'unknown';

  const file_name_match = content_disposition.match(/filename="?([^"]+)"?/);
  if (file_name_match) {
    file_name = file_name_match[1];
    const extension_match = file_name.match(/\.(\w+)$/);
    if (extension_match) {
      file_extension = extension_match[1].toLowerCase();
    }
  }

  return { file_name, file_extension };
};

const count_pdf_pages = async (buffer) => {
  try {
    const pdf_doc = await PDFDocument.load(buffer);
    return pdf_doc.getPageCount();
  } catch (error) {
    throw new Error('Failed to parse PDF document');
  }
};

const count_docx_pages = async (buffer) => {
  const temp_docx_path = get_temp_file_path('temp.docx');

  try {
    await fs.writeFile(temp_docx_path, buffer);

    const result = await mammoth.extractRawText({ path: temp_docx_path });
    const text = result.value;

    const page_count = Math.ceil(text.length / 1500);

    try {
      await fs.unlink(temp_docx_path);
    } catch (cleanup_error) {
      throw new Error('Error cleaning up temporary files');
    }

    return page_count;
  } catch (error) {
    throw new Error('Failed to process DOCX document');
  }
};

router.post('/pages', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await download_file(url);
    const { data: file_buffer, headers } = response;

    const content_disposition = headers['content-disposition'] || '';
    const { file_extension } = extract_file_details(content_disposition);

    let page_count = 0;

    if (file_extension === 'pdf') {
      page_count = await count_pdf_pages(file_buffer);
    } else if (file_extension === 'docx') {
      page_count = await count_docx_pages(file_buffer);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    res.json({ page_count });

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
