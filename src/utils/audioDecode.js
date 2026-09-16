// Real client-side audio analysis via the Web Audio API — decodes the
// uploaded file to get an exact duration and a downsampled peak array that
// WaveSurfer can render instantly (it keeps streaming the actual audio for
// playback in the background), instead of a fake bar generator.
export async function decodeAudioMetadata(file, numPeaks = 400) {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContextCtor();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / numPeaks));
    const peaks = new Array(numPeaks);

    for (let i = 0; i < numPeaks; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const v = Math.abs(channelData[start + j] || 0);
        if (v > max) max = v;
      }
      peaks[i] = Number(max.toFixed(4));
    }

    return { duration, peaks };
  } finally {
    audioCtx.close();
  }
}
