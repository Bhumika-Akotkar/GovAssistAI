require('dotenv').config({ path: '../.env' });
const { SarvamSTTProvider } = require('../src/integrations/stt/sarvamSttProvider');
const fs = require('fs');

async function main() {
    const provider = new SarvamSTTProvider();
    
    // Generate a simple 1 second silent WAV file buffer
    const numFrames = 16000; // 1 second at 16000 Hz
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = 16000 * blockAlign;
    const dataSize = numFrames * blockAlign;
    const wavHeader = Buffer.alloc(44);
    
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + dataSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
    wavHeader.writeUInt16LE(1, 20); // AudioFormat (PCM)
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(16000, 24); // SampleRate
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(16, 34); // BitsPerSample
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);
    
    const audioData = Buffer.alloc(dataSize); // filled with 0s (silence)
    const wavBuffer = Buffer.concat([wavHeader, audioData]);

    provider.on('transcript', (text, isFinal) => {
        console.log('Transcript received:', text, '(Final:', isFinal, ')');
    });

    provider.on('error', (err) => {
        console.error('Error occurred:', err.message || err);
    });

    console.log('Connecting...');
    await provider.connect('browser', 'hi-IN');
    
    console.log('Processing audio chunks...');
    const chunkSize = 4096;
    for(let i=0; i < wavBuffer.length; i+=chunkSize) {
        provider.processAudio(wavBuffer.subarray(i, i + chunkSize));
    }
    
    console.log('Disconnecting (triggers transcription)...');
    await provider.disconnect();
}

main().catch(console.error);
