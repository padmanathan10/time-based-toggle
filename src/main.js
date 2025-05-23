import './style.css';

gsap.registerPlugin(SplitText);
const body = document.body;
const blocks = document.querySelectorAll('.block');
const progress = document.querySelector('.progress');
const themeSwitch = document.querySelector('.theme-button');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playPauseBtns = document.querySelectorAll('.play-pause-btn');

let currentActiveIndex = 0;
let timerId = null;
let cycleDuration = 9999; // in milliseconds
let startTime;
let remainingTime = cycleDuration;
let isPaused = false;
let mouseOverActiveBlock = false;
let isMobile = window.innerWidth <= 1024;
let splitInstance = null;
let touchStartX = 0;
let touchEndX = 0;

function setActiveBlock(index) {
  // Remove active class from all blocks
  blocks.forEach((block) => {
    block.classList.remove('active');
    block.querySelector('p').classList.remove('split');
  });
  dots.forEach((dot) => {
    dot.classList.remove('active');
  });

  if (splitInstance) {
    splitInstance.revert(); // <-- This is important
    splitInstance = null;
  }

  // Set active block
  blocks[index].classList.add('active');
  dots[index].classList.add('active');
  const paragraph = blocks[index].querySelector('p');
  paragraph.classList.add('split');
  currentActiveIndex = index;
  document.fonts.ready.then(() => {
    splitInstance = new SplitText(paragraph, {
      type: 'words,lines',
      linesClass: 'line'
    });

    gsap.from(splitInstance.lines, {
      duration: 0.6,
      yPercent: 100,
      opacity: 0,
      stagger: 0.1,
      ease: 'expo.out'
    });
  });
}

function updateProgress(percentage) {
  progress.style.width = `${percentage}%`;
}

function resetTimer() {
  cancelAnimationFrame(timerId);
  remainingTime = cycleDuration;
  startTime = Date.now();
  updateProgress(0);
}

function animateProgress() {
  const elapsed = Date.now() - startTime;
  const percentage = Math.min(100, (elapsed / cycleDuration) * 100);

  updateProgress(percentage);

  if (percentage < 100 && !isPaused) {
    // Request next animation frame
    timerId = requestAnimationFrame(animateProgress);
  } else if (percentage >= 100) {
    // Move to next block
    cycleToNextBlock();
  }
}

function cycleToNextBlock() {
  const nextIndex = (currentActiveIndex + 1) % blocks.length;
  setActiveBlock(nextIndex);
  resetTimer();

  // Check if mouse is already over the new active block
  if (!isMobile && mouseOverActiveBlock) {
    pauseTimer();
  } else {
    animateProgress();
  }
}

function pauseTimer() {
  if (isPaused) return;

  isPaused = true;
  remainingTime = cycleDuration - (Date.now() - startTime);
  cancelAnimationFrame(timerId);
  updatePlayPauseButtons();
}

function resumeTimer() {
  if (!isPaused) return;

  isPaused = false;
  startTime = Date.now() - (cycleDuration - remainingTime);
  animateProgress();
  updatePlayPauseButtons();
}

function updatePlayPauseButtons() {
  playPauseBtns.forEach((btn) => {
    const pauseIcon = btn.querySelector('.pause-icon');
    const playIcon = btn.querySelector('.play-icon');

    if (isPaused) {
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'block';
    } else {
      pauseIcon.style.display = 'block';
      playIcon.style.display = 'none';
    }
  });
}

function handleBlockClick(index) {
  if (index === currentActiveIndex) return;

  setActiveBlock(index);
  resetTimer();

  // Since we just clicked this block, we know the mouse is over it
  // So pause the timer immediately after clicking a non-active block
  pauseTimer();
}

function handleDotClick(index) {
  if (isMobile || index === currentActiveIndex) return;

  setActiveBlock(index);
  resetTimer();
  animateProgress();
}

function handleMouseEnter(e) {
  if (isMobile) return;
  const block = e.target.closest('.block');
  const isActiveBlock = block && block.classList.contains('active');

  if (isActiveBlock) {
    mouseOverActiveBlock = true;
    pauseTimer();
  }
}

function handleMouseLeave(e) {
  if (isMobile) return;
  const block = e.target.closest('.block');
  const isActiveBlock = block && block.classList.contains('active');

  if (isActiveBlock) {
    mouseOverActiveBlock = false;
    resumeTimer();
  }
}

function handlePlayPauseClick(e) {
  if (!isMobile) return;

  e.stopPropagation();

  if (isPaused) {
    resumeTimer();
  } else {
    pauseTimer();
  }
}

function handlePrevClick() {
  const prevIndex = (currentActiveIndex - 1 + blocks.length) % blocks.length;
  setActiveBlock(prevIndex);
  resetTimer();

  // Always start timer when navigating with arrows
  if (isPaused) {
    isPaused = false;
    updatePlayPauseButtons();
  }
  animateProgress();
}

function handleNextClick() {
  const nextIndex = (currentActiveIndex + 1) % blocks.length;
  setActiveBlock(nextIndex);
  resetTimer();

  // Always start timer when navigating with arrows
  if (isPaused) {
    isPaused = false;
    updatePlayPauseButtons();
  }
  animateProgress();
}

function handleResize() {
  const wasMobile = isMobile;
  isMobile = window.innerWidth <= 1024;

  if (wasMobile !== isMobile) {
    // Reset state when switching between mobile and desktop
    if (isMobile) {
      mouseOverActiveBlock = false;
      if (isPaused) {
        resumeTimer();
      }
    }
  }
}

function handleSwipe(e) {
  if (!isMobile) return; // Only enable swipe on mobile

  touchEndX = e.changedTouches[0].screenX;

  // Calculate swipe distance
  const distance = touchStartX - touchEndX;

  // If the user swiped more than 50 pixels
  if (Math.abs(distance) > 50) {
    if (distance > 0) {
      // Swipe left - go to next
      handleNextClick();
    } else {
      // Swipe right - go to previous
      handlePrevClick();
    }
  }
}

// Initialize
setActiveBlock(currentActiveIndex);
resetTimer();
animateProgress();
updatePlayPauseButtons();

// Add event listeners to all blocks
blocks.forEach((block, index) => {
  block.addEventListener('click', () => handleBlockClick(index));
  block.addEventListener('mouseenter', handleMouseEnter);
  block.addEventListener('mouseleave', handleMouseLeave);
  block.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  block.addEventListener('touchend', handleSwipe);
});

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => handleDotClick(index));
});

playPauseBtns.forEach((btn) => {
  btn.addEventListener('click', handlePlayPauseClick);
});

prevBtn.addEventListener('click', handlePrevClick);
nextBtn.addEventListener('click', handleNextClick);

window.addEventListener('resize', handleResize);

// theme change
if (localStorage.theme === 'light') {
  body.classList.remove('dark');
} else {
  body.classList.add('dark');
  localStorage.setItem('theme', 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
  themeSwitch.addEventListener('click', () => {
    body.classList.toggle('dark');

    if (body.classList.contains('dark')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  });
});
