document.addEventListener('DOMContentLoaded', () => {

   // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCKUrPWze7zhdyM6Ramo0C4ELz0vwgz1M",
  authDomain: "attendance-app-sync.firebaseapp.com",
  databaseURL: "https://attendance-app-sync-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "attendance-app-sync",
  storageBucket: "attendance-app-sync.firebasestorage.app",
  messagingSenderId: "138851888790",
  appId: "1:138851888790:web:cd477e0c8f54588f4e9cb7",
  measurementId: "G-CPRHK06GTL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    
    // --- STATE MANAGEMENT (No changes here) ---
    const STUDENT_COLORS = {
        '--vibrant-gold': '#FFC75F', '--bright-teal': '#4BBEB5', '--royal-blue': '#4D9DE0',
        '--coral-orange': '#F99157', '--bright-sky': '#80C4E9'
    };
    const COLOR_NAMES = Object.keys(STUDENT_COLORS);
    let students = []; 
    let currentStudentIndex = null;
    let currentDate = new Date();
    let clickedDateStr = '';

    // (All element selectors are the same)
    const deleteStudentBtn = document.getElementById('delete-student-btn');
    const showAddViewBtn = document.getElementById('show-add-view-btn');
    const showListViewBtn = document.getElementById('show-list-view-btn');
    const addEntryView = document.getElementById('add-entry-view');
    const viewEntriesView = document.getElementById('view-entries-view');
    const studentsPage = document.getElementById('students-page');
    const detailsPage = document.getElementById('details-page');
    const studentWheelContainer = document.getElementById('student-wheel-container');
    const studentWheel = document.getElementById('student-wheel');
    const addStudentBtn = document.getElementById('add-student-btn');
    const selectedStudentHeader = document.getElementById('selected-student-header');
    const monthsContainer = document.getElementById('months-container');
    const backToStudentsBtn = document.getElementById('back-to-students-btn');
    const calendarContainer = document.getElementById('calendar-container');
    const backToMonthsBtn = document.getElementById('back-to-months-btn');
    const monthYearLabel = document.getElementById('month-year-label');
    const calendarDatesGrid = document.getElementById('calendar-dates-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const attendanceModal = document.getElementById('attendance-modal');
    const modalDateLabel = document.getElementById('modal-date-label');
    const dailyEntriesList = document.getElementById('daily-entries-list');
    const hoursInput = document.getElementById('hours-input');
    const timeRangeInput = document.getElementById('time-range-input');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');
    const cancelAttendanceBtn = document.getElementById('cancel-attendance-btn');

    // --- 2. UPDATED DATA FUNCTIONS ---
    // This function now saves the data to your Firebase cloud database
    function saveData() {
        database.ref('students').set(students);
    }

    // This function now loads data from Firebase and LISTENS for live changes
    function loadData() {
        database.ref('students').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                students = data;
            } else {
                students = [{ name: "First Student", attendance: {} }];
            }
            // If we are on the students page, re-render the list.
            if (!studentsPage.classList.contains('hidden')) {
                renderStudentTabs();
            }
        });
    }

    // (The rest of your functions do not need to be changed. 
    // They will automatically use the new saveData() function.)

    function isColorDark(hexColor) { const rgb = parseInt(hexColor.substring(1), 16); const r = (rgb >> 16) & 0xff; const g = (rgb >> 8) & 0xff; const b = (rgb >> 0) & 0xff; return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128; }
    function showPage(pageToShow) { [studentsPage, detailsPage].forEach(page => page.classList.toggle('hidden', page !== pageToShow)); }
    function updateWheelAnimation() { const containerCenter = studentWheelContainer.offsetWidth / 2; const scrollLeft = studentWheelContainer.scrollLeft; document.querySelectorAll('.student-tab').forEach(tab => { const tabCenter = tab.offsetLeft - scrollLeft + tab.offsetWidth / 2; const distanceFromCenter = tabCenter - containerCenter; const rotateY = distanceFromCenter / containerCenter * -45; const translateZ = -Math.abs(distanceFromCenter / containerCenter) * 200; const scale = 1 - Math.abs(distanceFromCenter / containerCenter) * 0.2; const opacity = 1 - Math.abs(distanceFromCenter / containerCenter) * 0.5; tab.style.transform = `scale(${scale}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`; tab.style.opacity = Math.max(0.3, opacity); }); }
    function renderStudentTabs() { studentWheel.innerHTML = ''; if (!students) return; students.forEach((student, index) => { if (!student) return; const tab = document.createElement('div'); tab.className = 'student-tab'; tab.textContent = student.name; const colorName = COLOR_NAMES[index % COLOR_NAMES.length]; const colorHex = STUDENT_COLORS[colorName]; tab.style.backgroundColor = `var(${colorName})`; if (isColorDark(colorHex)) { tab.style.color = 'var(--text-light)'; } else { tab.style.color = 'var(--text-dark)'; } tab.dataset.index = index; tab.addEventListener('click', handleStudentTabClick); studentWheel.appendChild(tab); }); setTimeout(updateWheelAnimation, 0); }
    addStudentBtn.addEventListener('click', () => { const newName = prompt("Enter the new student's name:"); if (newName && newName.trim()) { if (!students) { students = []; } students.push({ name: newName.trim(), attendance: {} }); saveData(); } });
    deleteStudentBtn.addEventListener('click', () => { if (currentStudentIndex === null) return; const studentName = students[currentStudentIndex].name; if (confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) { students.splice(currentStudentIndex, 1); saveData(); showPage(studentsPage); } });
    function handleStudentTabClick(event) { currentStudentIndex = parseInt(event.currentTarget.dataset.index); currentDate = new Date(); const clickedTab = event.currentTarget; const startRect = clickedTab.getBoundingClientRect(); const movingTab = clickedTab.cloneNode(true); movingTab.style.color = clickedTab.style.color; selectedStudentHeader.innerHTML = ''; selectedStudentHeader.appendChild(movingTab); const endRect = movingTab.getBoundingClientRect(); const dx = startRect.left - endRect.left; const dy = startRect.top - endRect.top; movingTab.style.transform = `translate(${dx}px, ${dy}px)`; requestAnimationFrame(() => { movingTab.style.transition = 'transform 0.5s ease-in-out'; movingTab.style.transform = 'translate(0, 0)'; }); populateMonths(); showPage(detailsPage); calendarContainer.style.display = 'none'; monthsContainer.style.display = 'grid'; }
    backToStudentsBtn.addEventListener('click', () => showPage(studentsPage));
    selectedStudentHeader.addEventListener('click', () => showPage(studentsPage));
    function populateMonths() { monthsContainer.innerHTML = ''; const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; const year = currentDate.getFullYear(); const studentData = students[currentStudentIndex]?.attendance; monthNames.forEach((month, index) => { const btn = document.createElement('button'); btn.className = 'month-btn'; btn.textContent = month; btn.addEventListener('click', () => { currentDate = new Date(year, index, 1); showCalendar(); }); let totalMonthHours = 0; if (studentData) { const daysInMonth = new Date(year, index + 1, 0).getDate(); for (let day = 1; day <= daysInMonth; day++) { const dateStr = `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; if (studentData[dateStr] && studentData[dateStr].length > 0) { totalMonthHours += studentData[dateStr].reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0); } } } if (totalMonthHours > 0) { const totalBadge = document.createElement('span'); totalBadge.className = 'month-total-hours'; if (totalMonthHours < 10) { totalBadge.classList.add('single-digit'); } else { totalBadge.classList.add('double-digit'); } totalBadge.textContent = totalMonthHours; btn.appendChild(totalBadge); } monthsContainer.appendChild(btn); }); }
    function showCalendar() { monthsContainer.style.display = 'none'; calendarContainer.style.display = 'flex'; renderCalendar(); }
    backToMonthsBtn.addEventListener('click', () => { monthsContainer.style.display = 'grid'; calendarContainer.style.display = 'none'; });
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    function renderCalendar() { const year = currentDate.getFullYear(); const month = currentDate.getMonth(); monthYearLabel.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`; calendarDatesGrid.innerHTML = ''; const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); for (let i = 0; i < firstDayOfMonth; i++) calendarDatesGrid.appendChild(document.createElement('div')); for (let day = 1; day <= daysInMonth; day++) { const dateSquare = document.createElement('div'); dateSquare.className = 'date-square'; dateSquare.textContent = day; const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; dateSquare.dataset.date = dateStr; const studentData = students[currentStudentIndex]?.attendance; if (studentData && studentData[dateStr]) { const totalHours = studentData[dateStr].reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0); if (totalHours > 0) { const badge = document.createElement('span'); badge.className = 'total-hours-badge'; badge.textContent = totalHours; dateSquare.appendChild(badge); } } dateSquare.addEventListener('click', () => openAttendanceModal(dateStr)); calendarDatesGrid.appendChild(dateSquare); } }
    function openAttendanceModal(dateStr) { clickedDateStr = dateStr; modalDateLabel.textContent = new Date(dateStr + 'T12:00:00Z').toLocaleDateString(); dailyEntriesList.innerHTML = ''; const entries = students[currentStudentIndex]?.attendance?.[dateStr]; if (entries && entries.length > 0) { entries.forEach((entry, index) => { const entryContainer = document.createElement('div'); const entryEl = document.createElement('span'); entryEl.innerHTML = `<strong>${entry.hours} hours</strong> (${entry.timeRange || 'No time given'})`; const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-entry-btn'; deleteBtn.textContent = 'X'; deleteBtn.dataset.index = index; deleteBtn.addEventListener('click', () => deleteEntry(dateStr, index)); entryContainer.appendChild(entryEl); entryContainer.appendChild(deleteBtn); dailyEntriesList.appendChild(entryContainer); }); showListViewBtn.click(); } else { dailyEntriesList.innerHTML = '<p>No entries for this date.</p>'; showAddViewBtn.click(); } hoursInput.value = ''; timeRangeInput.value = ''; attendanceModal.style.display = 'flex'; }
    function deleteEntry(dateStr, entryIndex) { const entries = students[currentStudentIndex].attendance[dateStr]; entries.splice(entryIndex, 1); if (entries.length === 0) { delete students[current
