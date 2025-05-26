import './slide.css';

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
let cycleDuration = 99000; // in milliseconds
let startTime;
let remainingTime = cycleDuration;
let isPaused = false;
let mouseOverActiveBlock = false;
let isMobile = window.innerWidth <= 1024;
let splitInstance = null;
let touchStartX = 0;
let touchEndX = 0;
let isAnimating = false;

function setActiveBlock(index, animate = true) {
  if (isAnimating) return;

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

  // Update mobile card positions and visibility
  if (isMobile) {
    updateMobileCardsLayout(animate);
  }

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

function updateMobileCardsLayout(animate = true) {
  if (!isMobile) return;

  const totalCards = blocks.length;
  const prevIndex = (currentActiveIndex - 1 + totalCards) % totalCards;
  const nextIndex = (currentActiveIndex + 1) % totalCards;

  blocks.forEach((block, index) => {
    // Add or remove transition class based on animate parameter
    if (animate) {
      block.classList.add('card-transition');
      isAnimating = true;
    } else {
      block.classList.remove('card-transition');
    }

    if (index === currentActiveIndex) {
      // Active card - center, full size
      block.style.transform = 'translateX(-50%) scale(1)';
      block.style.opacity = '1';
      block.style.zIndex = '10';
    } else if (index === prevIndex) {
      // Previous card - positioned to show 20% on left side
      block.style.transform = 'translateX(-150%) scale(0.85)';
      block.style.opacity = '0.8';
      block.style.zIndex = '5';
    } else if (index === nextIndex) {
      // Next card - positioned to show 20% on right side
      block.style.transform = 'translateX(50%) scale(0.85)';
      block.style.opacity = '0.8';
      block.style.zIndex = '5';
    } else {
      // Hidden cards - completely off screen
      let translateX;
      if (index < currentActiveIndex) {
        // Cards before current - hide on left
        translateX = index < prevIndex ? '-150%' : '-120%';
      } else {
        // Cards after current - hide on right
        translateX = index > nextIndex ? '150%' : '120%';
      }

      block.style.transform = `translateX(${translateX}) scale(0.75)`;
      block.style.opacity = '0';
      block.style.zIndex = '1';
    }
  });

  if (animate) {
    // Remove transition class and reset animation flag after transition completes
    setTimeout(() => {
      blocks.forEach((block) => {
        block.classList.remove('card-transition');
      });
      isAnimating = false;
    }, 600); // Match CSS transition duration
  }
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
  if (isAnimating) return;

  if (isMobile) {
    const totalCards = blocks.length;
    const prevIndex = (currentActiveIndex - 1 + totalCards) % totalCards;
    const nextIndex = (currentActiveIndex + 1) % totalCards;

    if (index === prevIndex) {
      handlePrevClick();
      return;
    } else if (index === nextIndex) {
      handleNextClick();
      return;
    } else if (index === currentActiveIndex) {
      // Toggle play/pause on active card click
      handlePlayPauseClick({ stopPropagation: () => {} });
      return;
    }
  }

  if (index === currentActiveIndex) return;

  setActiveBlock(index);
  resetTimer();

  // Since we just clicked this block, we know the mouse is over it
  // So pause the timer immediately after clicking a non-active block
  if (!isMobile) {
    pauseTimer();
  } else {
    animateProgress();
  }
}

function handleDotClick(index) {
  if (isAnimating || index === currentActiveIndex) return;

  setActiveBlock(index);
  resetTimer();

  if (isMobile) {
    animateProgress();
  } else {
    animateProgress();
  }
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
  if (isAnimating) return;

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
  if (isAnimating) return;

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
      // Initialize mobile layout with proper positioning
      blocks.forEach((block) => {
        block.style.position = 'absolute';
        block.style.left = '50%';
        block.style.transform = 'translateX(-50%)';
        block.style.transformOrigin = 'center center';
      });
      updateMobileCardsLayout(false);
    } else {
      // Reset mobile transforms for desktop
      blocks.forEach((block) => {
        block.style.position = '';
        block.style.left = '';
        block.style.transform = '';
        block.style.opacity = '';
        block.style.zIndex = '';
        block.style.transformOrigin = '';
        block.classList.remove('card-transition');
      });
    }
  }
}

function handleSwipeStart(e) {
  if (!isMobile || isAnimating) return;
  touchStartX = e.changedTouches[0].screenX;
}

function handleSwipe(e) {
  if (!isMobile || isAnimating) return;

  touchEndX = e.changedTouches[0].screenX;
  const distance = touchStartX - touchEndX;
  const minSwipeDistance = 50;

  // If the user swiped more than minimum distance
  if (Math.abs(distance) > minSwipeDistance) {
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
// Set up initial positioning for mobile
if (isMobile) {
  blocks.forEach((block) => {
    block.style.position = 'absolute';
    block.style.left = '50%';
    block.style.transform = 'translateX(-50%)';
    block.style.transformOrigin = 'center center';
  });
}

setActiveBlock(currentActiveIndex, false);
resetTimer();
animateProgress();
updatePlayPauseButtons();

// Add event listeners to all blocks
blocks.forEach((block, index) => {
  block.addEventListener('click', () => handleBlockClick(index));
  block.addEventListener('mouseenter', handleMouseEnter);
  block.addEventListener('mouseleave', handleMouseLeave);
  block.addEventListener('touchstart', handleSwipeStart);
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
