import imaps from 'imap-simple';
import { createClient } from '@deepgram/sdk';
import { config } from './config/config.js';
import { addFeedback } from './db/postgresdbhandler.js';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

const FILE_DIRECTORY = './files';

const cfg = {
  imap: {
    user: config.VLING_MAIL_ADDRESS,
    password: config.VLING_MAIL_PASSWORD,
    host: 'imap.gmail.com',
    tlsOptions: { rejectUnauthorized: false },
    port: 993,
    tls: true,
    authTimeout: 3000
  }
};

function downloadAttachments(attachments, downloadPath) {
  let files = [];
  attachments.forEach(attachment => {
    const filePath = path.join(downloadPath, attachment.filename);
    fs.writeFileSync(filePath, attachment.content);
    files.push(filePath);
    logger.info(`Downloaded: ${filePath}`);
  });

  return files;
};

async function checkEmails() {
  try {
    const connection = await imaps.connect(cfg);
    await connection.openBox('INBOX');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    let files = [];
    for (const message of messages) {
      const parts = imaps.getParts(message.attributes.struct);

      for (const part of parts) {
        if (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT') {
          const partData = await connection.getPartData(message, part);
          const attachment = {
            filename: part.disposition.params.filename,
            content: partData
          };
          let attachments = downloadAttachments([attachment], FILE_DIRECTORY);
          if(attachments && attachments.length > 0) {
            files.push(...attachments);
          }
        }
      }
      await connection.addFlags(message.attributes.uid, '\\Seen');
    }

    return files;

  } catch (err) {
    logger.error(err);
  }
};

async function transcribeFile(file) {
  const deepgram = createClient(config.VLING_DEEPGRAM_API_KEY);
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
  // path to the audio file
  fs.readFileSync(file),
  {
    model: "nova-2",
    smart_format: true,
  });

  if (error) throw error;

  if(result && result.results && 
    result.results.channels && result.results.channels.length > 0 &&
    result.results.channels[0].alternatives && result.results.channels[0].alternatives.length > 0) {
      await addFeedback(result.results.channels[0].alternatives[0].transcript);
      logger.info("Added new transcript to the database");
  }
};

export async function checkAndTranscribeMails() {
  let files = await checkEmails();
  if (files && files.length > 0) {
    for (const file of files) {
      if (isKnownAudioFormat(file)) {
        await transcribeFile(file);
      } else {
        logger.info(`File ${file} is not a known audio format.`);
      }
    }
  }
}

function isKnownAudioFormat(file) {
  const knownAudioFormats = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
  const fileExtension = file.slice(file.lastIndexOf('.')).toLowerCase();
  return knownAudioFormats.includes(fileExtension);
}


