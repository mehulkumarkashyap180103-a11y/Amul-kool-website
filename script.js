/**
 * AMUL ROYALE • ROSE VELVET MILK
 * High-Performance Frame Canvas Sequence & Interactive Experience
 */

(function () {
  'use strict';

  // --- CONFIGURATION ---
  const TOTAL_FRAMES = 240;
  const FRAME_PATH_PREFIX = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';
  
  // DOM Elements
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d');
  const heroSection = document.getElementById('hero-scroll');
  const scrollTracker = document.getElementById('scroll-tracker');
  const preloader = document.getElementById('preloader');
  const loadPercentEl = document.getElementById('load-percent');
  const preloaderBar = document.getElementById('preloader-progress');
  const preloaderStatus = document.getElementById('preloader-status');
  
  // HUD Elements
  const currentFrameNumEl = document.getElementById('current-frame-num');
  const hudPlayBtn = document.getElementById('hud-play-toggle');
  const hudPlayIcon = document.getElementById('hud-play-icon');
  const headerPlayBtn = document.getElementById('header-play-btn');
  const stageDots = document.querySelectorAll('.stage-dot');
  
  // Phase Elements
  const phase1 = document.getElementById('phase-1');
  const phase2 = document.getElementById('phase-2');
  const phase3 = document.getElementById('phase-3');
  const phase4 = document.getElementById('phase-4');
  
  // Audio Elements
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundLabel = document.getElementById('sound-label');

  // Modal & Cart
  const orderModal = document.getElementById('order-modal');
  const orderModalTrigger = document.getElementById('order-modal-trigger');
  const ctaQuickBuy = document.getElementById('cta-quick-buy');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyVal = document.getElementById('qty-val');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryTotal = document.getElementById('summary-total');
  const confirmOrderBtn = document.getElementById('confirm-order-btn');
  const pincodeInput = document.getElementById('pincode-input');
  const pincodeCheckBtn = document.getElementById('pincode-check-btn');
  const pincodeStatus = document.getElementById('pincode-status');
  const toastPortal = document.getElementById('toast-portal');

  // --- STATE ---
  const frames = [];
  let loadedCount = 0;
  let targetFrame = 1;
  let currentFrame = 1;
  let isPlayingAuto = false;
  let autoPlayTimer = null;
  let audioCtx = null;
  let isAudioPlaying = false;
  let audioOscillators = [];
  let audioGainNode = null;
  let cartQuantity = 1;
  const ITEM_BASE_PRICE = 45;

  // --- HELPER: FRAME FILENAME PADDING ---
  function getFrameUrl(index) {
    const padded = String(index).padStart(3, '0');
    return `${FRAME_PATH_PREFIX}${padded}${FRAME_EXT}`;
  }

  // --- 1. FRAME PRELOADER WITH CONCURRENCY BATCHING ---
  function preloadImages() {
    let loaded = 0;
    
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      
      img.onload = () => {
        loaded++;
        loadedCount = loaded;
        const pct = Math.floor((loaded / TOTAL_FRAMES) * 100);
        loadPercentEl.textContent = pct;
        preloaderBar.style.width = pct + '%';
        
        if (loaded === 30) {
          preloaderStatus.textContent = 'Infusing natural rose essence...';
        } else if (loaded === 120) {
          preloaderStatus.textContent = 'Balancing velvety Anand milk cream...';
        } else if (loaded === 200) {
          preloaderStatus.textContent = 'Polishing chilled apothecary glass...';
        }

        if (loaded === TOTAL_FRAMES) {
          setTimeout(finishLoading, 400);
        }
      };

      img.onerror = () => {
        // Fallback for any missing frame: re-use previous
        loaded++;
        if (loaded === TOTAL_FRAMES) {
          setTimeout(finishLoading, 400);
        }
      };

      frames[i] = img;
    }
  }

  function finishLoading() {
    preloader.classList.add('fade-out');
    // Initial canvas render
    resizeCanvas();
    renderFrame(1);
    createFloatingPetals();
  }

  // --- 2. RETINA CANVAS SIZING & RENDER ENGINE ---
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Force redraw of current frame
    renderFrame(Math.round(currentFrame));
  }

  function renderFrame(index) {
    const clampedIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(index)));
    const img = frames[clampedIndex];
    if (!img || !img.complete) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Calculate aspect fit / cover math (original frame is 1280x720)
    const imgW = img.naturalWidth || 1280;
    const imgH = img.naturalHeight || 720;
    const scale = Math.max(w / imgW, h / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;
    const offsetX = (w - renderW) / 2;
    const offsetY = (h - renderH) / 2;

    // Draw frame
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    // Update HUD indicator
    if (currentFrameNumEl) {
      currentFrameNumEl.textContent = String(clampedIndex).padStart(3, '0');
    }
  }

  // --- 3. LERP ANIMATION LOOP ---
  function animationLoop() {
    // Smooth lerp: moves smoothly towards targetFrame
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.05) {
      currentFrame += diff * 0.16;
      renderFrame(currentFrame);
      updateStoryPhases(currentFrame);
    }
    
    requestAnimationFrame(animationLoop);
  }

  // --- 4. SCROLL PROGRESS TRACKING ---
  function onScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const globalProgress = docHeight > 0 ? scrollY / docHeight : 0;
    
    // Update global top progress bar
    if (scrollTracker) {
      scrollTracker.style.width = (globalProgress * 100) + '%';
    }

    // Calculate scroll progress within hero-scroll (600vh)
    const heroRect = heroSection.getBoundingClientRect();
    const sectionTop = heroSection.offsetTop;
    const sectionHeight = heroSection.offsetHeight - window.innerHeight;

    if (scrollY >= sectionTop && scrollY <= sectionTop + sectionHeight) {
      const heroProgress = (scrollY - sectionTop) / sectionHeight;
      const clamped = Math.max(0, Math.min(1, heroProgress));
      
      if (!isPlayingAuto) {
        targetFrame = Math.round(clamped * (TOTAL_FRAMES - 1)) + 1;
      }
    } else if (scrollY < sectionTop) {
      if (!isPlayingAuto) targetFrame = 1;
    } else {
      if (!isPlayingAuto) targetFrame = TOTAL_FRAMES;
    }
  }

  // --- 5. STORY PHASES SYNCHRONIZATION ---
  function updateStoryPhases(frame) {
    const progress = (frame - 1) / (TOTAL_FRAMES - 1);

    // Phase 1: 0% - 18% (Frames 1 - 44)
    const isP1 = progress >= 0 && progress < 0.18;
    // Phase 2: 18% - 46% (Frames 45 - 110)
    const isP2 = progress >= 0.18 && progress < 0.46;
    // Phase 3: 46% - 72% (Frames 111 - 173)
    const isP3 = progress >= 0.46 && progress < 0.72;
    // Phase 4: 72% - 100% (Frames 174 - 240)
    const isP4 = progress >= 0.72 && progress <= 1.0;

    togglePhase(phase1, isP1);
    togglePhase(phase2, isP2);
    togglePhase(phase3, isP3);
    togglePhase(phase4, isP4);

    // Update Stage Dots in HUD
    stageDots.forEach((dot, idx) => {
      let active = false;
      if (idx === 0 && isP1) active = true;
      if (idx === 1 && isP2) active = true;
      if (idx === 2 && isP3) active = true;
      if (idx === 3 && isP4) active = true;
      dot.classList.toggle('active', active);
    });
  }

  function togglePhase(el, active) {
    if (!el) return;
    if (active) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  }

  // --- 6. AUTO-PLAY CINEMA MODE ---
  function toggleAutoPlay() {
    isPlayingAuto = !isPlayingAuto;
    
    if (isPlayingAuto) {
      hudPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
      hudPlayBtn.classList.add('playing');
      if (headerPlayBtn) {
        headerPlayBtn.querySelector('.btn-lbl').textContent = 'Pause Cinema';
      }
      playCinemaStep();
      showToast('🎬 Cinema Playback Activated', 'info');
    } else {
      stopAutoPlay();
      showToast('⏸ Cinema Mode Paused', 'info');
    }
  }

  function stopAutoPlay() {
    isPlayingAuto = false;
    hudPlayIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    hudPlayBtn.classList.remove('playing');
    if (headerPlayBtn) {
      headerPlayBtn.querySelector('.btn-lbl').textContent = 'Cinema Play';
    }
    if (autoPlayTimer) {
      cancelAnimationFrame(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  function playCinemaStep() {
    if (!isPlayingAuto) return;
    
    targetFrame += 0.8;
    if (targetFrame >= TOTAL_FRAMES) {
      targetFrame = TOTAL_FRAMES;
      stopAutoPlay();
      return;
    }

    // Sync scroll bar gently if user is watching
    const sectionTop = heroSection.offsetTop;
    const sectionHeight = heroSection.offsetHeight - window.innerHeight;
    const desiredScrollY = sectionTop + ((targetFrame - 1) / (TOTAL_FRAMES - 1)) * sectionHeight;
    window.scrollTo({ top: desiredScrollY, behavior: 'auto' });

    autoPlayTimer = requestAnimationFrame(playCinemaStep);
  }

  // Stop auto play if user manually scrolls or touches
  window.addEventListener('wheel', () => {
    if (isPlayingAuto) stopAutoPlay();
  }, { passive: true });

  window.addEventListener('touchmove', () => {
    if (isPlayingAuto) stopAutoPlay();
  }, { passive: true });

  // --- 7. TIMELINE STAGE JUMPS ---
  stageDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      stopAutoPlay();
      const targetProgress = parseFloat(dot.getAttribute('data-target-progress') || 0);
      const sectionTop = heroSection.offsetTop;
      const sectionHeight = heroSection.offsetHeight - window.innerHeight;
      const scrollToY = sectionTop + targetProgress * sectionHeight;

      window.scrollTo({
        top: scrollToY,
        behavior: 'smooth'
      });
      playSoftChime(520);
    });
  });

  // --- 8. WEB AUDIO API SYNTHESIZER (Luxury Ambient Soundscape) ---
  function initAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }

  function toggleAudio() {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isAudioPlaying = !isAudioPlaying;
    
    if (isAudioPlaying) {
      startSoundscape();
      soundToggleBtn.classList.add('playing');
      soundLabel.textContent = 'Sound: ON';
      showToast('🎵 Ethereal Dairy Ambience Playing', 'success');
    } else {
      stopSoundscape();
      soundToggleBtn.classList.remove('playing');
      soundLabel.textContent = 'Sound: OFF';
    }
  }

  function startSoundscape() {
    if (!audioCtx) return;

    // Create gentle warm pink harmonic chords (F#3, A#3, C#4, F4)
    const frequencies = [185.0, 233.08, 277.18, 349.23];
    audioGainNode = audioCtx.createGain();
    audioGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
    audioGainNode.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 3);

    // Warm Low-pass filter for cozy velvety milk feel
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);

    audioOscillators = frequencies.map((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Subtle vibrato/detune
      osc.detune.setValueAtTime(idx * 2 - 3, audioCtx.currentTime);
      
      osc.connect(filter);
      osc.start();
      return osc;
    });

    filter.connect(audioGainNode);
    audioGainNode.connect(audioCtx.destination);
  }

  function stopSoundscape() {
    if (audioGainNode && audioCtx) {
      audioGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      setTimeout(() => {
        audioOscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch (e) {}
        });
        audioOscillators = [];
      }, 1200);
    }
  }

  function playSoftChime(freq = 440) {
    if (!audioCtx || !isAudioPlaying) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
  }

  // --- 9. FLOATING PARTICLES GENERATOR ---
  function createFloatingPetals() {
    const field = document.getElementById('particle-field');
    if (!field) return;

    for (let i = 0; i < 18; i++) {
      const petal = document.createElement('div');
      petal.className = 'floating-petal';
      const size = Math.random() * 16 + 10;
      petal.style.width = size + 'px';
      petal.style.height = (size * 1.3) + 'px';
      petal.style.left = (Math.random() * 100) + '%';
      petal.style.animationDelay = (Math.random() * 12) + 's';
      petal.style.animationDuration = (Math.random() * 10 + 10) + 's';
      field.appendChild(petal);
    }
  }

  // --- 10. MODAL & CART INTERACTION ---
  function openOrderModal(flavorName = 'Amul Royale Rose Milk', price = 45) {
    document.getElementById('modal-item-title').textContent = flavorName;
    document.getElementById('modal-item-price').textContent = `₹${price}`;
    cartQuantity = 1;
    qtyVal.textContent = cartQuantity;
    updateCartCalculations(price);
    orderModal.classList.add('show');
    playSoftChime(640);
  }

  function closeOrderModal() {
    orderModal.classList.remove('show');
  }

  function updateCartCalculations(unitPrice = 45) {
    const total = cartQuantity * unitPrice;
    summarySubtotal.textContent = `₹${total}`;
    summaryTotal.textContent = `₹${total}`;
  }

  if (qtyPlus) {
    qtyPlus.addEventListener('click', () => {
      cartQuantity++;
      qtyVal.textContent = cartQuantity;
      updateCartCalculations();
      playSoftChime(580);
    });
  }

  if (qtyMinus) {
    qtyMinus.addEventListener('click', () => {
      if (cartQuantity > 1) {
        cartQuantity--;
        qtyVal.textContent = cartQuantity;
        updateCartCalculations();
        playSoftChime(420);
      }
    });
  }

  if (orderModalTrigger) orderModalTrigger.addEventListener('click', () => openOrderModal());
  if (ctaQuickBuy) ctaQuickBuy.addEventListener('click', () => openOrderModal());
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeOrderModal);

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === orderModal) closeOrderModal();
  });

  // Pincode Verification Simulation
  if (pincodeCheckBtn && pincodeInput) {
    pincodeCheckBtn.addEventListener('click', () => {
      const code = pincodeInput.value.trim();
      if (/^\d{6}$/.test(code)) {
        pincodeStatus.className = 'pincode-status valid';
        pincodeStatus.textContent = '✓ Express Chilled Delivery in 30 mins available!';
      } else {
        pincodeStatus.className = 'pincode-status invalid';
        pincodeStatus.textContent = '⚠ Please enter a valid 6-digit Indian PIN code';
      }
    });
  }

  // Confirm order
  if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', () => {
      closeOrderModal();
      showToast('🎉 Order Placed! Chilled courier dispatched from nearest Amul depot.', 'success');
      playSoftChime(880);
    });
  }

  // Replay Flow Button
  const replayBtn = document.getElementById('replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      stopAutoPlay();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      playSoftChime(640);
    });
  }

  // Top Nav Stage Buttons
  document.querySelectorAll('.nav-stage-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      stopAutoPlay();
      const targetProgress = parseFloat(btn.getAttribute('data-target-progress') || 0);
      const sectionTop = heroSection.offsetTop;
      const sectionHeight = heroSection.offsetHeight - window.innerHeight;
      const scrollToY = sectionTop + targetProgress * sectionHeight;

      window.scrollTo({
        top: scrollToY,
        behavior: 'smooth'
      });
      playSoftChime(520);
    });
  });

  // --- 11. TOAST PORTAL NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastPortal.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }

  // --- 14. EVENT LISTENERS ---
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas);
  
  if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleAudio);
  if (hudPlayBtn) hudPlayBtn.addEventListener('click', toggleAutoPlay);
  if (headerPlayBtn) headerPlayBtn.addEventListener('click', toggleAutoPlay);

  // Initialize
  preloadImages();
  animationLoop();

})();
