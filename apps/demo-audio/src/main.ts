import { AudioManager } from '@game-engine/audio';

const audioManager = new AudioManager();

// References
const musicBtn = document.getElementById('btn-music') as HTMLButtonElement;
const sfxBtn = document.getElementById('btn-sfx') as HTMLButtonElement;
const stopBtn = document.getElementById('btn-stop') as HTMLButtonElement;
const volumeSlider = document.getElementById('volume') as HTMLInputElement;

// Volume control
volumeSlider.addEventListener('input', () => {
  const vol = parseInt(volumeSlider.value, 10) / 100;
  audioManager.setMasterVolume(vol);
});

// Music
musicBtn.addEventListener('click', async () => {
  musicBtn.textContent = 'Loading...';
  musicBtn.disabled = true;
  try {
    // Use a publicly available audio file as demo
    await audioManager.load('/demo-audio/bg-music.mp3');
    await audioManager.playMusic('/demo-audio/bg-music.mp3', { loop: true, fadeIn: 1 });
    musicBtn.textContent = 'Music Playing';
  } catch (err: any) {
    musicBtn.textContent = 'Load Music (will 404)';
    musicBtn.disabled = false;
    console.warn('Audio load simulation —', err.message);
    // Fall back to simulated audio for demo without real files
  }
});

// SFX
sfxBtn.addEventListener('click', async () => {
  try {
    if (!audioManager.getBuffer('/demo-audio/sfx.mp3')) {
      await audioManager.load('/demo-audio/sfx.mp3');
    }
    audioManager.playSfx('/demo-audio/sfx.mp3', { volume: 0.5 });
  } catch {
    console.warn('SFX would play here with real audio files');
  }
});

// Stop music
stopBtn.addEventListener('click', () => {
  audioManager.stopMusic(0.5);
  musicBtn.textContent = 'Load & Play Music';
  musicBtn.disabled = false;
});

console.log('Audio demo ready. Click "Load & Play Music" to start.');