import express from 'express';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

const app = express();
const port = 3000;

// Включите парсер тела запроса для JSON
app.use(express.json());

// Определите текущую директорию
const get_current_dir = () => path.resolve();

// Путь к временным файлам
const get_temp_file_path = (filename) => path.join(get_current_dir(), filename);

// Функция для логирования с временной меткой
const log_info = (message, data = {}) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
};

const log_error = (message, error) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
};

// Функция для загрузки файла по URL
const download_file = async (url) => {
  log_info('Starting download from URL', { url });
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response;
  } catch (error) {
    log_error('Failed to download file', error);
    throw new Error('Failed to download file');
  }
};

// Функция для извлечения имени файла и расширения из заголовка content-disposition
const extract_file_details = (content_disposition) => {
  log_info('Extracting file details from content-disposition', { content_disposition });

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

// Функция для подсчета количества страниц в PDF
const count_pdf_pages = async (buffer) => {
  log_info('Processing PDF document');
  try {
    const pdf_doc = await PDFDocument.load(buffer);
    return pdf_doc.getPageCount();
  } catch (error) {
    log_error('Failed to parse PDF document', error);
    throw new Error('Failed to parse PDF document');
  }
};

// Функция для подсчета количества страниц в DOCX
const count_docx_pages = async (buffer) => {
  log_info('Processing DOCX document');
  const temp_docx_path = get_temp_file_path('temp.docx');

  try {
    await fs.writeFile(temp_docx_path, buffer);
    log_info('DOCX file saved to temp file', { temp_docx_path });

    const result = await mammoth.extractRawText({ path: temp_docx_path });
    const text = result.value;

    const page_count = Math.ceil(text.length / 1500); // Оценка на основе количества текста
    log_info('DOCX page count estimated', { page_count });

    try {
      await fs.unlink(temp_docx_path);
      log_info('Temporary DOCX file deleted', { temp_docx_path });
    } catch (cleanup_error) {
      log_error('Error cleaning up temporary files', cleanup_error);
    }

    return page_count;
  } catch (error) {
    log_error('Failed to process DOCX document', error);
    throw new Error('Failed to process DOCX document');
  }
};

// Основной обработчик запроса
app.post('/pages', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    log_error('URL is required');
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await download_file(url);
    const { data: file_buffer, headers } = response;

    // Получаем имя и расширение файла из заголовка content-disposition
    const content_disposition = headers['content-disposition'] || '';
    const { file_extension } = extract_file_details(content_disposition);

    log_info('Extracted file details', { file_extension });

    let page_count = 0;

    if (file_extension === 'pdf') {
      page_count = await count_pdf_pages(file_buffer);
    } else if (file_extension === 'docx') {
      page_count = await count_docx_pages(file_buffer);
    } else {
      log_error('Unsupported file format', { file_extension });
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    res.json({ page_count });

  } catch (error) {
    log_error('Error processing document', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  log_info(`Server running on port ${port}`);
});
