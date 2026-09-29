const { EventEmitter } = require('events');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { SarvamAIClient } = require('sarvamai');
const { STTProvider } = require('../ProviderInterfaces');

class SarvamSTTProvider extends STTProvider {
  constructor() {
    super();
    this.client = new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY || '' });
    this.chunks = [];
    this.isConnected = false;
  }

  async connect(provider = 'browser', language = 'hi-IN') {
    return new Promise((resolve) => {
      console.log(`[SarvamSTTProvider] Ready to record for language: ${language}...`);
      this.language = language;
      this.isConnected = true;
      this.chunks = [];
      resolve();
    });
  }

  processAudio(audioBuffer) {
    if (this.isConnected) {
      this.chunks.push(audioBuffer);
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    this.isConnected = false;

    if (this.chunks.length === 0) {
      return;
    }

    try {
      const fullBuffer = Buffer.concat(this.chunks);
      this.chunks = [];
      
      const tempPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.webm`);
      fs.writeFileSync(tempPath, fullBuffer);
      
      console.log(`[SarvamSTTProvider] Transcribing audio of size ${fullBuffer.length} bytes...`);
      const fileStream = fs.createReadStream(tempPath);
      
      const langCode = this.language.includes('-') ? this.language : `${this.language}-IN`;
      
      // Using the exact snippet logic
      const response = await this.client.speechToText.transcribe({
        file: fileStream,
        model: "saaras:v4",
        language_code: langCode,
        mode: "transcribe",
        sample_rate: 16000,
      });

      fs.unlinkSync(tempPath);

      if (response && response.transcript) {
        this.emit('transcript', response.transcript, true);
      }
    } catch (error) {
      console.error('[SarvamSTTProvider] Transcription error:', error);
      this.emit('error', error);
    }
  }
}

module.exports = { SarvamSTTProvider };
