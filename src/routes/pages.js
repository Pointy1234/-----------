import express from 'express';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

const router = express.Router();

// Определите текущую директорию
const getCurrentDir = () => path.resolve();

// Путь к временным файлам
const getTempFilePath = (filename) => path.join(getCurrentDir(), filename);

// Функция для логирования с временной меткой
const logInfo = (message, data = {}) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
};

const logError = (message, error) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
};

// Функция для загрузки файла по URL
const downloadFile = async (url) => {
  logInfo('Starting download from URL', { url });
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response;
  } catch (error) {
    logError('Failed to download file', error);
    throw new Error('Failed to download file');
  }
};

// Функция для извлечения имени файла и расширения из заголовка content-disposition
const extractFileDetails = (contentDisposition) => {
  logInfo('Extracting file details from content-disposition', { contentDisposition });

  let fileName = 'unknown';
  let fileExtension = 'unknown';

  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  if (fileNameMatch) {
    fileName = fileNameMatch[1];
    const extensionMatch = fileName.match(/\.(\w+)$/);
    if (extensionMatch) {
      fileExtension = extensionMatch[1].toLowerCase();
    }
  }

  return { fileName, fileExtension };
};

// Функция для подсчета количества страниц в PDF
const countPdfPages = async (buffer) => {
  logInfo('Processing PDF document');
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    logError('Failed to parse PDF document', error);
    throw new Error('Failed to parse PDF document');
  }
};

// Функция для подсчета количества страниц в DOCX
const countDocxPages = async (buffer) => {
  logInfo('Processing DOCX document');
  const tempDocxPath = getTempFilePath('temp.docx');

  try {
    await fs.writeFile(tempDocxPath, buffer);
    logInfo('DOCX file saved to temp file', { tempDocxPath });

    const result = await mammoth.extractRawText({ path: tempDocxPath });
    const text = result.value;

    const pageCount = Math.ceil(text.length / 1500); // Оценка на основе количества текста
    logInfo('DOCX page count estimated', { pageCount });

    try {
      await fs.unlink(tempDocxPath);
      logInfo('Temporary DOCX file deleted', { tempDocxPath });
    } catch (cleanupError) {
      logError('Error cleaning up temporary files', cleanupError);
    }

    return pageCount;
  } catch (error) {
    logError('Failed to process DOCX document', error);
    throw new Error('Failed to process DOCX document');
  }
};

// Основной обработчик запроса
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    logError('URL is required');
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await downloadFile(url);
    const { data: fileBuffer, headers } = response;

    // Получаем имя и расширение файла из заголовка content-disposition
    const contentDisposition = headers['content-disposition'] || '';
    const { fileExtension } = extractFileDetails(contentDisposition);

    logInfo('Extracted file details', { fileExtension });

    let pageCount = 0;

    if (fileExtension === 'pdf') {
      pageCount = await countPdfPages(fileBuffer);
    } else if (fileExtension === 'docx') {
      pageCount = await countDocxPages(fileBuffer);
    } else {
      logError('Unsupported file format', { fileExtension });
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    res.json({ pageCount });

  } catch (error) {
    logError('Error processing document', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
