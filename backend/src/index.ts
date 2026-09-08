import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { transcribeAudio, transcribeAudioFile } from './controllers/audio.controller.ts';
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post('/transcribe-audio/', transcribeAudio);
app.post('/transcribe-audio-file/', upload.single('audio'), transcribeAudioFile);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
