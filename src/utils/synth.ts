/**
 * Soft realtime synthesizer engine using Web Audio API.
 * This guarantees offline-safe audio generation, bypassing CORS
 * and enabling flawless Canvas/Audio MediaRecorder export.
 */

export function startSynthLoop(
  type: "chill" | "techno" | "vintage" | "drum-loop",
  ctx: AudioContext,
  dest: AudioNode
): { stop: () => void } {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
  masterGain.connect(dest);

  let activeInterval: NodeJS.Timeout | null = null;
  let activeTimeouts: number[] = [];

  const addTimeout = (fn: () => void, delayMs: number) => {
    const t = window.setTimeout(fn, delayMs);
    activeTimeouts.push(t);
  };

  if (type === "chill") {
    // -----------------------------------------------------
    // CHILL LO-FI CHORDS
    // Play warm minor-9th pads and soft mechanical clocks
    // -----------------------------------------------------
    const chords = [
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
      [146.83, 174.61, 220.00, 261.63, 311.13], // Dm9
      [110.00, 138.59, 164.81, 207.65, 246.94], // Amaj9
      [123.47, 146.83, 185.00, 220.00, 277.18]  // Bm9
    ];
    let chordIdx = 0;

    const playPad = () => {
      const activeChord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      const chordGain = ctx.createGain();
      chordGain.gain.setValueAtTime(0, ctx.currentTime);
      chordGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.5);
      chordGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5.8);
      chordGain.connect(masterGain);

      const oscillators = activeChord.map((freq) => {
        const osc = ctx.createOscillator();
        const lowpass = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        // detune slightly for warm vinyl chorus effect
        osc.detune.setValueAtTime((Math.random() - 0.5) * 12, ctx.currentTime);

        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(450, ctx.currentTime);

        osc.connect(lowpass);
        lowpass.connect(chordGain);
        osc.start();
        return osc;
      });

      addTimeout(() => {
        oscillators.forEach(osc => {
          try { osc.stop(); } catch(e){}
        });
      }, 6000);
    };

    // Soft hihat ticks
    const playTick = (time: number) => {
      const noise = ctx.createOscillator();
      noise.type = "sine";
      noise.frequency.setValueAtTime(8000 + Math.random() * 2000, time);

      const tickGain = ctx.createGain();
      tickGain.gain.setValueAtTime(0.015, time);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

      noise.connect(tickGain);
      tickGain.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.1);
    };

    // Trigger pad every 6 seconds
    playPad();
    const padInterval = setInterval(playPad, 6000);

    // Trigger tick pattern
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      const now = ctx.currentTime;
      playTick(now);
      if (tickCount % 4 === 0) {
        // play an extra off-beat tick
        playTick(now + 0.25);
      }
      tickCount++;
    }, 500);

    return {
      stop: () => {
        clearInterval(padInterval);
        clearInterval(tickInterval);
        activeTimeouts.forEach(clearTimeout);
        masterGain.disconnect();
      }
    };

  } else if (type === "techno") {
    // -----------------------------------------------------
    // TECHNO SYNTHWAVE BASSLINE & KICK BEAT
    // Driving 80s arpeggio and punchy sub kick
    // -----------------------------------------------------
    const bassline = [110, 110, 130, 130, 98, 98, 73, 82]; // Hz frequencies
    let bassStep = 0;

    const playKick = (time: number) => {
      const osc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

      kickGain.gain.setValueAtTime(0.4, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

      osc.connect(kickGain);
      kickGain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.35);
    };

    const playBassMelody = (time: number) => {
      const freq = bassline[bassStep];
      bassStep = (bassStep + 1) % bassline.length;

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 0.5, time); // sub bass

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + 0.25);
      osc2.stop(time + 0.25);
    };

    let step = 0;
    const seqInterval = setInterval(() => {
      const now = ctx.currentTime;
      // Kick on step 0 and 4 (quarter notes)
      if (step % 4 === 0) {
        playKick(now);
      }
      playBassMelody(now);
      step = (step + 1) % 8;
    }, 250); // 120 BPM sixteenth notes roughly

    return {
      stop: () => {
        clearInterval(seqInterval);
        masterGain.disconnect();
      }
    };

  } else if (type === "vintage") {
    // -----------------------------------------------------
    // VINTAGE ACOUSTIC AND HARMONIC MOODS
    // Beautiful, delicate, and airy chime melodies
    // -----------------------------------------------------
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // Pentatonic Major
    let step = 0;

    const playChime = () => {
      const noteFreq = scale[Math.floor(Math.random() * scale.length)];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = ctx.createDelay();
      const feedback = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      // Cute vintage delay loop
      delay.delayTime.value = 0.35;
      feedback.gain.value = 0.45;

      osc.connect(gain);
      gain.connect(masterGain);

      // Connect delay
      gain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      feedback.connect(masterGain);

      osc.start();
      addTimeout(() => {
        try { osc.stop(); } catch(e){}
      }, 3000);
    };

    const runInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        playChime();
      }
    }, 800);

    return {
      stop: () => {
        clearInterval(runInterval);
        activeTimeouts.forEach(clearTimeout);
        masterGain.disconnect();
      }
    };

  } else {
    // -----------------------------------------------------
    // DRUM & BEAT LOOP
    // Dynamic acoustic beats
    // -----------------------------------------------------
    const playHat = (time: number, accent: boolean) => {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 9000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(accent ? 0.04 : 0.015, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(time);
      noise.stop(time + 0.05);
    };

    const playKick = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.16);
    };

    const playSnare = (time: number) => {
      // White noise snare
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.value = 1500;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      // Snare snap tone
      const tone = ctx.createOscillator();
      const toneGain = ctx.createGain();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(180, time);
      toneGain.gain.setValueAtTime(0.12, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      tone.connect(toneGain);
      toneGain.connect(masterGain);

      noise.start(time);
      tone.start(time);
      noise.stop(time + 0.16);
      tone.stop(time + 0.16);
    };

    let beatStep = 0;
    const runBeat = setInterval(() => {
      const now = ctx.currentTime;
      // Kick on 0 and 4
      if (beatStep === 0 || beatStep === 4) {
        playKick(now);
      }
      // Snare on 2 and 6
      if (beatStep === 2 || beatStep === 6) {
        playSnare(now);
      }
      // Hats on odds and regular ticks
      playHat(now, beatStep % 2 === 0);

      beatStep = (beatStep + 1) % 8;
    }, 300);

    return {
      stop: () => {
        clearInterval(runBeat);
        masterGain.disconnect();
      }
    };
  }
}
