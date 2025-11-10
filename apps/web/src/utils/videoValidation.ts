export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let cleaned = false;

    const cleanup = () => {
      if (!cleaned) {
        URL.revokeObjectURL(url);
        cleaned = true;
      }
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (video.duration === Infinity) {
        video.currentTime = Number.MAX_SAFE_INTEGER;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          const duration = video.duration;
          cleanup();
          resolve(duration);
        };
        return;
      }
      const duration = video.duration;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('No se pudo leer el video.'));
    };
    video.src = url;
  });
}

export async function ensureMaxVideoDuration(file: File, maxSeconds: number) {
  const duration = await getVideoDuration(file);
  if (duration > maxSeconds + 0.1) {
    throw new Error(`El video debe durar máximo ${maxSeconds} segundos.`);
  }
}


