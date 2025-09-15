document.addEventListener('DOMContentLoaded', () => {

    const STUDENT_COLORS = {
        '--vibrant-gold': '#FFC75F',
        '--bright-teal': '#4BBEB5',
        '--royal-blue': '#4D9DE0',
        '--coral-orange': '#F99157',
        '--bright-sky': '#80C4E9'
    };
    const COLOR_NAMES = Object.keys(STUDENT_COLORS);

    let students = []; 
    let currentStudentIndex = null;
    let currentDate = new Date();
    let clickedDateStr = '';

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

    function isColorDark(hexColor) {
        const rgb = parseInt(hexColor.substring(1), 16);
        const r = (rgb >> 16) & 0xff; const g = (rgb >> 8) & 0xff; const b = (rgb >> 0) & 0xff;
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
    }

    function saveData() { localStorage.setItem('attendanceData', JSON.stringify(students)); }
    function loadData() {
        const savedData = localStorage.getItem('attendanceData');
        students = savedData ? JSON.parse(savedData) : [{ name: "First Student", attendance: {} }];
    }

    function showPage(pageToShow) { [studentsPage, detailsPage].forEach(page => page.classList.toggle('hidden', page !== pageToShow)); }
    
    function updateWheelAnimation() {
        const containerCenter = studentWheelContainer.offsetWidth / 2;
        const scrollLeft = studentWheelContainer.scrollLeft;
        document.querySelectorAll('.student-tab').forEach(tab => {
            const tabCenter = tab.offsetLeft - scrollLeft + tab.offsetWidth / 2;
            const distanceFromCenter = tabCenter - containerCenter;
            const rotateY = distanceFromCenter / containerCenter * -45; 
            const translateZ = -Math.abs(distanceFromCenter / containerCenter) * 200;
            const scale = 1 - Math.abs(distanceFromCenter / containerCenter) * 0.2;
            const opacity = 1 - Math.abs(distanceFromCenter / containerCenter) * 0.5;
            tab.style.transform = `scale(${scale}) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
            tab.style.opacity = Math.max(0.3, opacity);
        });
    }
    
    function renderStudentTabs() {
        studentWheel.innerHTML = '';
        students.forEach((student, index) => {
            const tab = document.createElement('div');
            tab.className = 'student-tab';
            tab.textContent = student.name;
            const colorName = COLOR_NAMES[index % COLOR_NAMES.length];
            const colorHex = STUDENT_COLORS[colorName];
            tab.style.backgroundColor = `var(${colorName})`;
            if (isColorDark(colorHex)) { tab.style.color = 'var(--text-light)'; } else { tab.style.color = 'var(--text-dark)'; }
            tab.dataset.index = index;
            tab.addEventListener('click', handleStudentTabClick);
            studentWheel.appendChild(tab);
        });
        setTimeout(updateWheelAnimation, 0);
    }

    addStudentBtn.addEventListener('click', () => {
        const newName = prompt("Enter the new student's name:");
        if (newName && newName.trim()) {
            students.push({ name: newName.trim(), attendance: {} });
            saveData();
            renderStudentTabs();
        }
    });

    deleteStudentBtn.addEventListener('click', () => {
        if (currentStudentIndex === null) return;
        const studentName = students[currentStudentIndex].name;
        if (confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
            students.splice(currentStudentIndex, 1);
            saveData();
            renderStudentTabs();
            showPage(studentsPage);
        }
    });

    function handleStudentTabClick(event) {
        currentStudentIndex = parseInt(event.currentTarget.dataset.index);
        currentDate = new Date();
        const clickedTab = event.currentTarget;
        const startRect = clickedTab.getBoundingClientRect();
        const movingTab = clickedTab.cloneNode(true);
        movingTab.style.color = clickedTab.style.color; 
        selectedStudentHeader.innerHTML = '';
        selectedStudentHeader.appendChild(movingTab);
        const endRect = movingTab.getBoundingClientRect();
        const dx = startRect.left - endRect.left;
        const dy = startRect.top - endRect.top;
        movingTab.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
            movingTab.style.transition = 'transform 0.5s ease-in-out';
            movingTab.style.transform = 'translate(0, 0)';
        });
        
        populateMonths();
        showPage(detailsPage);
        calendarContainer.style.display = 'none';
        monthsContainer.style.display = 'grid';
    }
    
    backToStudentsBtn.addEventListener('click', () => showPage(studentsPage));
    selectedStudentHeader.addEventListener('click', () => showPage(studentsPage));
    
    function populateMonths() {
        monthsContainer.innerHTML = '';
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const year = currentDate.getFullYear();
        const studentData = students[currentStudentIndex].attendance;
        monthNames.forEach((month, index) => {
            const btn = document.createElement('button');
            btn.className = 'month-btn';
            btn.textContent = month;
            btn.addEventListener('click', () => {
                currentDate = new Date(year, index, 1);
                showCalendar();
            });
            let totalMonthHours = 0;
            const daysInMonth = new Date(year, index + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (studentData && studentData[dateStr] && studentData[dateStr].length > 0) {
                    totalMonthHours += studentData[dateStr].reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
                }
            }
            if (totalMonthHours > 0) {
                const totalBadge = document.createElement('span');
                totalBadge.className = 'month-total-hours';
                if (totalMonthHours < 10) { totalBadge.classList.add('single-digit'); } else { totalBadge.classList.add('double-digit'); }
                totalBadge.textContent = totalMonthHours;
                btn.appendChild(totalBadge);
            }
            monthsContainer.appendChild(btn);
        });
    }

    function showCalendar() { /* ... no change ... */ }
    backToMonthsBtn.addEventListener('click', () => { /* ... no change ... */ });
    prevMonthBtn.addEventListener('click', () => { /* ... no change ... */ });
    nextMonthBtn.addEventListener('click', () => { /* ... no change ... */ });
    function renderCalendar() { /* ... no change ... */ }
    
    function openAttendanceModal(dateStr) {
        clickedDateStr = dateStr;
        modalDateLabel.textContent = new Date(dateStr + 'T12:00:00Z').toLocaleDateString();
        dailyEntriesList.innerHTML = '';
        const entries = students[currentStudentIndex].attendance[dateStr];
        if (entries && entries.length > 0) {
            entries.forEach((entry, index) => {
                const entryContainer = document.createElement('div');
                const entryEl = document.createElement('span');
                entryEl.innerHTML = `<strong>${entry.hours} hours</strong> (${entry.timeRange || 'No time given'})`;
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-entry-btn';
                deleteBtn.textContent = 'X';
                deleteBtn.dataset.index = index;
                deleteBtn.addEventListener('click', () => deleteEntry(dateStr, index));
                entryContainer.appendChild(entryEl);
                entryContainer.appendChild(deleteBtn);
                dailyEntriesList.appendChild(entryContainer);
            });
            showListViewBtn.click();
        } else {
            dailyEntriesList.innerHTML = '<p>No entries for this date.</p>';
            showAddViewBtn.click();
        }
        hoursInput.value = '';
        timeRangeInput.value = '';
        attendanceModal.style.display = 'flex';
    }

    function deleteEntry(dateStr, entryIndex) {
        const entries = students[currentStudentIndex].attendance[dateStr];
        entries.splice(entryIndex, 1);
        if (entries.length === 0) {
            delete students[currentStudentIndex].attendance[dateStr];
        }
        saveData();
        renderCalendar();
        populateMonths();
        openAttendanceModal(dateStr);
    }

    function closeAttendanceModal() { attendanceModal.style.display = 'none'; }
    showAddViewBtn.addEventListener('click', () => { addEntryView.classList.remove('hidden'); viewEntriesView.classList.add('hidden'); showAddViewBtn.classList.add('active'); showListViewBtn.classList.remove('active'); saveAttendanceBtn.style.display = 'inline-block'; });
    showListViewBtn.addEventListener('click', () => { addEntryView.classList.add('hidden'); viewEntriesView.classList.remove('hidden'); showAddViewBtn.classList.remove('active'); showListViewBtn.classList.add('active'); saveAttendanceBtn.style.display = 'none'; });
    cancelAttendanceBtn.addEventListener('click', closeAttendanceModal);
    attendanceModal.addEventListener('click', (event) => { if (event.target === attendanceModal) { closeAttendanceModal(); } });
    
    saveAttendanceBtn.addEventListener('click', () => {
        const hours = hoursInput.value;
        const timeRange = timeRangeInput.value;
        if (!hours || isNaN(hours)) {
            alert("Please enter a valid number for hours.");
            return;
        }
        const studentData = students[currentStudentIndex].attendance;
        if (!studentData[clickedDateStr]) {
            studentData[clickedDateStr] = [];
        }
        studentData[clickedDateStr].push({ hours: parseFloat(hours), timeRange });
        saveData();
        closeAttendanceModal();
        renderCalendar();
        populateMonths();
    });

    // NEW: This code block adds the "save with Enter key" functionality
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevents any default browser action
            saveAttendanceBtn.click(); // Programmatically "clicks" the save button
        }
    }
    hoursInput.addEventListener('keydown', handleEnterKey);
    timeRangeInput.addEventListener('keydown', handleEnterKey);

    // --- INITIALIZATION ---
    loadData();
    renderStudentTabs();
    studentWheelContainer.addEventListener('scroll', updateWheelAnimation);
});
