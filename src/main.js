import './style.css';

gsap.registerPlugin(SplitText);
const body = document.body;
const blocks = document.querySelectorAll('.block');
const progress = document.querySelector('.progress');
const themeSwitch = document.querySelector('.theme-button');

let currentActiveIndex = 0;
let timerId = null;
let cycleDuration = 3000; // in milliseconds
let startTime;
let remainingTime = cycleDuration;
let isPaused = false;
let mouseOverActiveBlock = false;

function setActiveBlock(index) {
  // Remove active class from all blocks
  blocks.forEach((block) => {
    block.classList.remove('active');
    block.querySelector('p').classList.remove('split');
  });

  // Set active block
  blocks[index].classList.add('active');
  blocks[index].querySelector('p').classList.add('split');
  currentActiveIndex = index;
  document.fonts.ready.then(() => {
    let split;
    SplitText.create('.split', {
      type: 'words,lines',
      linesClass: 'line',
      autoSplit: true,
      mask: 'lines',
      onSplit: (self) => {
        split = gsap.from(self.lines, {
          duration: 0.6,
          yPercent: 100,
          opacity: 0,
          stagger: 0.1,
          ease: 'expo.out'
        });
        return split;
      }
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
  if (mouseOverActiveBlock) {
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
}

function resumeTimer() {
  if (!isPaused) return;

  isPaused = false;
  startTime = Date.now() - (cycleDuration - remainingTime);
  animateProgress();
}

function handleBlockClick(index) {
  if (index === currentActiveIndex) return;

  setActiveBlock(index);
  resetTimer();

  // Since we just clicked this block, we know the mouse is over it
  // So pause the timer immediately after clicking a non-active block
  pauseTimer();
}

function handleMouseEnter(e) {
  const block = e.target;
  const isActiveBlock = block.classList.contains('active');

  if (isActiveBlock) {
    mouseOverActiveBlock = true;
    pauseTimer();
  }
}

function handleMouseLeave(e) {
  const block = e.target;
  const isActiveBlock = block.classList.contains('active');

  if (isActiveBlock) {
    mouseOverActiveBlock = false;
    resumeTimer();
  }
}

// Initialize
setActiveBlock(currentActiveIndex);
resetTimer();
animateProgress();

// Add event listeners to all blocks
blocks.forEach((block, index) => {
  block.addEventListener('click', () => handleBlockClick(index));
  block.addEventListener('mouseenter', handleMouseEnter);
  block.addEventListener('mouseleave', handleMouseLeave);
});

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
