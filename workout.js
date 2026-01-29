// === SIMPLIFIED WORKOUT TRACKER ===

// Configuration
const config = {
  soundEnabled: true,
  theme: 'dark'
};

// === TIMER ===
let timer;
let seconds = 0;
let running = false;

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startTimer() {
  if (running) return;
  
  running = true;
  timer = setInterval(() => {
    seconds++;
    document.getElementById("timer-display").textContent = formatTime(seconds);
  }, 1000);
  
  // Update start button
  const startBtn = document.getElementById('start-btn');
  startBtn.innerHTML = '<i class="fas fa-play"></i><span>Running...</span>';
  startBtn.classList.add('workout-complete');
  
  playSound('start');
}

function stopTimer() {
  running = false;
  clearInterval(timer);
  
  // Update start button
  const startBtn = document.getElementById('start-btn');
  startBtn.innerHTML = '<i class="fas fa-play"></i><span>Start Timer</span>';
  startBtn.classList.remove('workout-complete');
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  document.getElementById("timer-display").textContent = "00:00:00";
}

// === SOUND ===
function playSound(type) {
  if (!config.soundEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'start':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        break;
      case 'complete':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
}

// === TOAST NOTIFICATIONS ===
function showToast(title, message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  
  if (!toast || !toastTitle || !toastMessage) return;
  
  // Set type-specific styling
  toast.classList.remove('border-primary', 'border-success', 'border-warning');
  switch(type) {
    case 'success':
      toast.classList.add('border-success');
      break;
    case 'warning':
      toast.classList.add('border-warning');
      break;
    default:
      toast.classList.add('border-primary');
  }
  
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  // Show toast
  toast.classList.remove('translate-x-full');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full');
  }, 5000);
}

// === CALENDAR ===
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

let currentMonthIndex = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNameEl = document.getElementById("month-name");
const yearDisplayEl = document.getElementById("year-display");
const calendarBody = document.getElementById("calendar-body");

function getMonthKey() {
  return `${currentYear}-${months[currentMonthIndex]}`;
}

function generateCalendar() {
  let calendarHTML = '';
  
  for (let week = 1; week <= 4; week++) {
    let weekHTML = `<tr><td class="p-4 text-center font-bold text-gray-300 bg-dark-900">W${week}</td>`;
    
    for (let day = 1; day <= 7; day++) {
      const dayNumber = (week - 1) * 7 + day;
      
      if (day === 1 || day === 3 || day === 5) {
        // Workout days
        let workoutType;
        if (day === 1) workoutType = 'PUSH';
        else if (day === 3) workoutType = 'PULL';
        else workoutType = 'LEGS';
        const icon = workoutType === 'PUSH' ? 'fa-arrow-up' :
                    workoutType === 'PULL' ? 'fa-arrow-down' : 'fa-walking';

        weekHTML += `
          <td class="calendar-cell p-4 text-center bg-dark-800 border border-dark-600 hover:bg-dark-700 transition-all duration-200 cursor-pointer"
              data-day="${dayNumber}" data-type="${workoutType.toLowerCase()}">
            <div class="text-lg font-bold">${dayNumber}</div>
            <div class="text-gray-500 mt-1">
            </div>
          </td>`;
      } else if (dayNumber <= 28) {
        // Rest days
        weekHTML += `<td class="p-4 text-center bg-dark-900 border-dark-900">
          <div class="text-gray-500">
            <i class="fas fa-bed"></i>
          </div>
        </td>`;
      } else {
        weekHTML += `<td class="p-4 text-center bg-dark-900 border border-dark-900"></td>`;
      }
    }
    
    weekHTML += '</tr>';
    calendarHTML += weekHTML;
  }
  
  calendarBody.innerHTML = calendarHTML;
  setupCalendarCells();
  loadCalendarData();
  updateCalendarStats();
}

function setupCalendarCells() {
  const cells = calendarBody.querySelectorAll('.calendar-cell');
  cells.forEach((cell) => {
    cell.addEventListener('click', () => {
      cell.classList.toggle('checked-cell');
      cell.classList.toggle('bg-dark-800');
      cell.classList.toggle('hover:bg-dark-700');
      
      if (cell.classList.contains('checked-cell')) {
        const type = cell.dataset.type;
        showToast('Workout Logged', `${type.toUpperCase()} workout completed!`, 'success');
      }
      
      saveCalendarData();
      updateCalendarStats();
    });
  });
}

function loadCalendarData() {
  const key = getMonthKey();
  const data = JSON.parse(localStorage.getItem(key)) || {};
  
  const cells = calendarBody.querySelectorAll('.calendar-cell');
  cells.forEach((cell) => {
    const day = cell.dataset.day;
    
    if (data[day]) {
      cell.classList.add('checked-cell');
      cell.classList.remove('bg-dark-800', 'hover:bg-dark-700');
    }
  });
}

function saveCalendarData() {
  const key = getMonthKey();
  const cells = calendarBody.querySelectorAll('.calendar-cell');
  const data = {};
  
  cells.forEach((cell) => {
    const day = cell.dataset.day;
    data[day] = cell.classList.contains('checked-cell');
  });
  
  localStorage.setItem(key, JSON.stringify(data));
}

function updateCalendarStats() {
  const cells = calendarBody.querySelectorAll('.calendar-cell');
  const checkedCells = calendarBody.querySelectorAll('.calendar-cell.checked-cell');
  const percentage = cells.length > 0 ? Math.round((checkedCells.length / cells.length) * 100) : 0;
  
  // Update UI
  const statsElement = document.getElementById('completion-percentage');
  if (statsElement) {
    statsElement.textContent = `${percentage}%`;
  }
}

function changeMonth(direction) {
  currentMonthIndex += direction;
  
  if (currentMonthIndex < 0) {
    currentMonthIndex = 11;
    currentYear--;
  } else if (currentMonthIndex > 11) {
    currentMonthIndex = 0;
    currentYear++;
  }
  
  monthNameEl.textContent = months[currentMonthIndex];
  yearDisplayEl.textContent = currentYear;
  generateCalendar();
}

function markCurrentWeek() {
  const today = new Date().getDate();
  const currentWeek = Math.ceil(today / 7);
  
  const cells = calendarBody.querySelectorAll(`tr:nth-child(${currentWeek}) .calendar-cell`);
  cells.forEach(cell => {
    if (!cell.classList.contains('checked-cell')) {
      cell.classList.add('checked-cell');
      cell.classList.remove('bg-dark-800', 'hover:bg-dark-700');
    }
  });
  
  saveCalendarData();
  updateCalendarStats();
  showToast('Week Completed!', 'All workouts for this week marked as done.', 'success');
}

// === WORKOUT LIBRARY ===
const exercises = {
  push: [
    { name: "Bench Press", sets: 4, reps: "6-10", rest: "120s" },
    { name: "Shoulder Press", sets: 3, reps: "8-10", rest: "120s" },
    { name: "Lateral Raise", sets: 4, reps: "12-15", rest: "60s" },
    { name: "Chest Fly", sets: 3, reps: "10-12", rest: "90s" },
    { name: "Overhead Extension", sets: 3, reps: "10-12", rest: "90s" }
  ],

  pull: [
    { name: "Pull-Up", sets: 4, reps: "6-8", rest: "150s" },
    { name: "Barbell Row", sets: 4, reps: "6-10", rest: "120s" },
    { name: "One-Arm Row", sets: 3, reps: "10-12", rest: "90s" },
    { name: "Bicep Curl", sets: 3, reps: "10-12", rest: "75s" },
    { name: "Hammer Curl", sets: 3, reps: "10-12", rest: "60s" }
  ],

  legs: [
    { name: "Squat", sets: 4, reps: "5-8", rest: "150s" },
    { name: "Lunge", sets: 3, reps: "10-12", rest: "90s" },
    { name: "Deadlift", sets: 3, reps: "5-6", rest: "180s" },
    { name: "Leg Press", sets: 3, reps: "12-15", rest: "90s" },
    { name: "Calf Raise", sets: 4, reps: "15-20", rest: "60s" }
  ]
};

let currentType = "push";
let currentIndex = 0;
let currentSet = 1;
let restTimer;
let isResting = false;
let restSeconds = 0;

function renderExercise() {
  const list = exercises[currentType];
  if (!list || list.length === 0) return;

  const exercise = list[currentIndex];

  // Update exercise name and details
  document.getElementById("exercise-name").textContent = exercise.name;
  document.getElementById("current-set").textContent = currentSet;
  document.getElementById("target-sets").textContent = exercise.sets;
  document.getElementById("target-sets-detail").textContent = exercise.sets;
  document.getElementById("target-reps-display").textContent = exercise.reps;
  document.getElementById("target-reps").textContent = exercise.reps;

  // Update rest time display
  const restTimeEl = document.getElementById("rest-time");
  if (isResting) {
    restTimeEl.textContent = `${restSeconds}s`;
    restTimeEl.classList.add('rest-timer-active');
  } else {
    restTimeEl.textContent = exercise.rest;
    restTimeEl.classList.remove('rest-timer-active');
  }

  // Update active tab
  document.querySelectorAll(".tab").forEach(tab => {
    const isActive = tab.dataset.type === currentType;
    tab.setAttribute("data-active", isActive);
  });

  // Update progress dots
  const progressDots = document.getElementById("progress-dots");
  if (progressDots) {
    progressDots.innerHTML = '';
    for (let i = 0; i < list.length; i++) {
      const dot = document.createElement('div');
      dot.className = `w-3 h-3 rounded-full ${i === currentIndex ? 'bg-primary' : 'bg-dark-600'}`;
      progressDots.appendChild(dot);
    }
  }

  // Update button state
  const completeBtn = document.getElementById('complete-exercise');
  if (isResting) {
    completeBtn.disabled = true;
    completeBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    completeBtn.disabled = false;
    completeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

function nextExercise() {
  const list = exercises[currentType];
  currentIndex = (currentIndex + 1) % list.length;
  currentSet = 1;
  renderExercise();
}

function prevExercise() {
  const list = exercises[currentType];
  currentIndex = (currentIndex - 1 + list.length) % list.length;
  currentSet = 1;
  renderExercise();
}

function startRest(restTime) {
  if (isResting) return;

  isResting = true;
  restSeconds = parseInt(restTime.replace('s', ''));

  const completeBtn = document.getElementById('complete-exercise');
  const restTimeEl = document.getElementById('rest-time');

  // Disable button
  completeBtn.disabled = true;
  completeBtn.classList.add('opacity-50', 'cursor-not-allowed');

  // Add rest timer active class
  restTimeEl.classList.add('rest-timer-active');

  restTimer = setInterval(() => {
    restSeconds--;
    restTimeEl.textContent = `${restSeconds}s`;

    if (restSeconds <= 0) {
      clearInterval(restTimer);
      isResting = false;

      // Re-enable button
      completeBtn.disabled = false;
      completeBtn.classList.remove('opacity-50', 'cursor-not-allowed');

      // Remove rest timer active class
      restTimeEl.classList.remove('rest-timer-active');

      // Play sound
      playSound('complete');

      // Show toast
      showToast('Rest Complete!', 'Time to start your next set!', 'success');

      // Reset display
      renderExercise();
    }
  }, 1000);
}

function completeExercise() {
  if (isResting) return; // Prevent clicking during rest

  const exercise = exercises[currentType][currentIndex];

  if (currentSet < exercise.sets) {
    currentSet++;
    showToast('Set Completed!', `Set ${currentSet-1}/${exercise.sets} of ${exercise.name} done.`, 'info');
    startRest(exercise.rest);
  } else {
    showToast('Exercise Complete!', `Great job! You finished ${exercise.name}.`, 'success');
    nextExercise();
  }

  renderExercise();
}

// === THEME MANAGEMENT ===
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('theme-dark');
  
  if (isDark) {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
    body.classList.remove('bg-gradient-to-br', 'from-dark-900', 'via-dark-800', 'to-dark-900');
    body.classList.add('bg-gradient-to-br', 'from-gray-100', 'via-white', 'to-gray-200');
    config.theme = 'light';
  } else {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
    body.classList.remove('bg-gradient-to-br', 'from-gray-100', 'via-white', 'to-gray-200');
    body.classList.add('bg-gradient-to-br', 'from-dark-900', 'via-dark-800', 'to-dark-900');
    config.theme = 'dark';
  }
  
  // Update theme toggle icon
  const themeIcon = document.querySelector('#theme-toggle i');
  if (themeIcon) {
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  // Save theme preference
  localStorage.setItem('workoutTrackerTheme', config.theme);
}

// === INITIALIZATION ===
document.addEventListener("DOMContentLoaded", () => {
  // Load saved theme
  const savedTheme = localStorage.getItem('workoutTrackerTheme');
  if (savedTheme && savedTheme === 'light') {
    toggleTheme();
  }
  
  // Timer buttons
  document.getElementById("start-btn").addEventListener("click", startTimer);
  document.getElementById("stop-btn").addEventListener("click", stopTimer);
  document.getElementById("reset-btn").addEventListener("click", resetTimer);
  
  // Sound toggle
  const soundToggle = document.getElementById("sound-toggle");
  if (soundToggle) {
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) {
      config.soundEnabled = savedSound === 'true';
      soundToggle.checked = config.soundEnabled;
    }
    
    soundToggle.addEventListener("change", (e) => {
      config.soundEnabled = e.target.checked;
      localStorage.setItem('soundEnabled', config.soundEnabled);
    });
  }
  
  // Calendar
  generateCalendar();
  monthNameEl.textContent = months[currentMonthIndex];
  yearDisplayEl.textContent = currentYear;
  
  document.getElementById("prev-month").addEventListener("click", () => changeMonth(-1));
  document.getElementById("next-month").addEventListener("click", () => changeMonth(1));
  document.getElementById("mark-all-week").addEventListener("click", markCurrentWeek);
  
  // Workout library
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      currentType = tab.dataset.type;
      currentIndex = 0;
      currentSet = 1;
      renderExercise();
    });
  });
  
  document.querySelector(".next").addEventListener("click", nextExercise);
  document.querySelector(".prev").addEventListener("click", prevExercise);
  document.getElementById("complete-exercise").addEventListener("click", completeExercise);
  
  // Theme toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  
  // Quick start button
  document.getElementById("quick-start-btn").addEventListener("click", () => {
    startTimer();
    showToast('Quick Start!', 'Workout timer started. Get ready!', 'success');
  });
  
  // Toast close button
  document.querySelector(".close-toast").addEventListener("click", () => {
    document.getElementById("toast").classList.add("translate-x-full");
  });
  
  // Initialize exercise display
  renderExercise();

  // Add spacebar keybind for complete exercise
  document.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.key, 'isResting:', isResting);
    if (e.key === ' ' && !isResting) {
      e.preventDefault(); // Prevent page scroll
      console.log('Spacebar triggered completeExercise');
      completeExercise();
    }
  });

  // Show welcome message
  setTimeout(() => {
    showToast('Welcome to Workout Tracker!', 'Your fitness journey starts now. Click quick start to begin.', 'info');
  }, 1000);
});