export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function getImageDimensions(src: string): Promise<{ width: number; height: number }>
{
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = (error) => reject(error);
    img.src = src;
  });
}

export async function extractAudioMetadata(file: File): Promise<{ duration: number; dataUrl: string }>
{
  const dataUrl = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      resolve({ duration, dataUrl });
    };
    audio.onerror = (event) => reject(event);
    audio.src = dataUrl;
  });
}

export async function createWaveformSamples(dataUrl: string, sampleCount = 120): Promise<number[]> {
  const audioContext = new AudioContext();
  const response = await fetch(dataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / sampleCount);
  const samples = new Array<number>(sampleCount).fill(0);
  for (let i = 0; i < sampleCount; i++) {
    let sum = 0;
    const blockStart = blockSize * i;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[blockStart + j] ?? 0);
    }
    samples[i] = sum / blockSize;
  }
  const max = Math.max(...samples, 1);
  return samples.map((value) => value / max);
}
