(function() {
  const soundGrid = document.getElementById('sound-grid');
  const nowPlaying = document.getElementById('now-playing');
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const activeMixer = document.getElementById('active-mixer');

  const activeSounds = new Map();
  let masterVolume = 0.5;
  let audioCtx = null;

  const savedVolume = localStorage.getItem('nebulaMusicVolume');
  if (savedVolume) {
    masterVolume = parseFloat(savedVolume);
    volumeSlider.value = masterVolume * 100;
  }

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function createNoise(type) {
    const bufferSize = 2 * audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  const soundGenerators = {
    rain: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('pink');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 4000;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.3;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, gain };
    },
    cafe: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('brown');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.4;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, gain };
    },
    forest: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('pink');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 2;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.2;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { oscillators: [], noise, gain };
    },
    ocean: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('brown');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const gain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      gain.gain.value = 0.25;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, lfo, gain };
    },
    fire: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('pink');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 300;
      filter.Q.value = 1;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.35;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, gain };
    },
    wind: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('white');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      const gain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      gain.gain.value = 0.2;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, lfo, gain };
    },
    thunder: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('brown');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.4;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, gain };
    },
    night: () => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = createNoise('pink');
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.15;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      return { source: noise, gain };
    }
  };

  function saveActiveSounds() {
    const sounds = Array.from(activeSounds.keys());
    localStorage.setItem('nebulaMusicActive', JSON.stringify(sounds));
  }

  function loadActiveSounds() {
    const saved = localStorage.getItem('nebulaMusicActive');
    if (saved) {
      try {
        const sounds = JSON.parse(saved);
        sounds.forEach(name => {
          const card = soundGrid.querySelector(`[data-sound="${name}"]`);
          if (card) toggleSound(card, false);
        });
      } catch (e) {}
    }
  }

  function updateVolume() {
    masterVolume = volumeSlider.value / 100;
    localStorage.setItem('nebulaMusicVolume', masterVolume.toString());
    activeSounds.forEach((nodes, name) => {
      if (nodes.gain) {
        nodes.gain.gain.value = masterVolume;
      }
    });
  }

  function toggleSound(card, shouldSave = true) {
    const name = card.dataset.sound;

    if (activeSounds.has(name)) {
      const nodes = activeSounds.get(name);
      if (nodes.source) nodes.source.stop();
      if (nodes.oscillators) nodes.oscillators.forEach(o => o.stop());
      if (nodes.lfo) nodes.lfo.stop();
      activeSounds.delete(name);
      card.classList.remove('active');
    } else {
      initAudio();
      const nodes = soundGenerators[name]();
      if (nodes && nodes.gain) {
        nodes.gain.gain.value = masterVolume;
        nodes.gain.connect(audioCtx.destination);
      }
      activeSounds.set(name, nodes);
      card.classList.add('active');
    }

    updateNowPlaying();
    updateMixerDisplay();
    if (shouldSave) saveActiveSounds();
  }

  function updateNowPlaying() {
    if (activeSounds.size === 0) {
      nowPlaying.textContent = 'Select a sound to begin';
    } else {
      const names = Array.from(activeSounds.keys()).map(s => s.charAt(0).toUpperCase() + s.slice(1));
      nowPlaying.textContent = 'Now playing: ' + names.join(' + ');
    }
  }

  function updateMixerDisplay() {
    if (activeSounds.size === 0) {
      activeMixer.innerHTML = '';
    } else {
      let html = '';
      activeSounds.forEach((nodes, name) => {
        html += `<div class="mixer-item">
          <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
          <button class="mixer-remove" data-sound="${name}">×</button>
        </div>`;
      });
      activeMixer.innerHTML = html;

      activeMixer.querySelectorAll('.mixer-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = soundGrid.querySelector(`[data-sound="${btn.dataset.sound}"]`);
          if (card) toggleSound(card);
        });
      });
    }
  }

  function stopAll() {
    activeSounds.forEach((nodes, name) => {
      if (nodes.source) nodes.source.stop();
      if (nodes.oscillators) nodes.oscillators.forEach(o => o.stop());
      if (nodes.lfo) nodes.lfo.stop();
    });
    activeSounds.clear();
    soundGrid.querySelectorAll('.sound-card').forEach(c => c.classList.remove('active'));
    updateNowPlaying();
    updateMixerDisplay();
    saveActiveSounds();
  }

  if (soundGrid) {
    soundGrid.querySelectorAll('.sound-card').forEach(card => {
      card.addEventListener('click', () => toggleSound(card));
    });
  }

  if (stopBtn) stopBtn.addEventListener('click', stopAll);
  if (volumeSlider) volumeSlider.addEventListener('input', updateVolume);

  loadActiveSounds();
  updateNowPlaying();
  updateMixerDisplay();
})();