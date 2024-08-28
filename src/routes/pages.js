import express from 'express';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import logger from '../logger.js';

const router = express.Router();
const temp_dir = path.join(process.cwd(), 'temp');

// Убедитесь, что временная папка существует
fs.ensureDirSync(temp_dir);

// Функция для загрузки файла
const download_file = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response;
  } catch (error) {
    logger.error(`Failed to download file: ${error.message}`);
    throw new Error('Failed to download file');
  }
};

// Функция для извлечения деталей файла из заголовка content-disposition
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

// Функция для конвертации DOCX в HTML
const convert_docx_to_html = async (buffer) => {
  try {
    const result = await mammoth.convertToHtml({ buffer });
    return result.value;
  } catch (error) {
    logger.error(`Failed to convert DOCX to HTML: ${error.message}`);
    throw new Error('Failed to convert DOCX to HTML');
  }
};

// Функция для конвертации HTML в PDF
const convert_html_to_pdf = async (html) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    logger.error(`Failed to convert HTML to PDF: ${error.message}`);
    throw new Error('Failed to convert HTML to PDF');
  }
};

// Функция для подсчета страниц в PDF
const get_pdf_page_count = async (pdfBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    logger.error(`Failed to count pages in PDF: ${error.message}`);
    throw new Error('Failed to count pages in PDF');
  }
};

// Обработчик POST-запросов на /pages
router.post('/pages', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    logger.warn('URL is required');
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    logger.info(`Processing file from URL: ${url}`);
    const response = await download_file(url);
    const { data: file_buffer, headers } = response;

    const content_disposition = headers['content-disposition'] || '';
    const { file_extension } = extract_file_details(content_disposition);

    let page_count = 0;

    if (file_extension === 'pdf') {
      // Подсчет страниц в PDF
      page_count = await get_pdf_page_count(file_buffer);
    } else if (file_extension === 'docx') {
      // Конвертация DOCX в HTML, затем в PDF и подсчет страниц
      const html = await convert_docx_to_html(file_buffer);
      const pdfBuffer = await convert_html_to_pdf(html);
      page_count = await get_pdf_page_count(pdfBuffer);
    } else {
      logger.warn('Unsupported file format');
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    logger.info(`Page count for file ${file_extension}: ${page_count}`);
    res.json({ page_count });

  } catch (error) {
    logger.error(`Internal server error: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
