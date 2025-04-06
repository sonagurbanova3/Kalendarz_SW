const calendar = document.getElementById("calendar");
const systemSelect = document.getElementById("system");
const workedEl = document.getElementById("worked-hours");
const overtimeEl = document.getElementById("overtime");
const plannedEl = document.getElementById("planned-hours");

const popup = document.getElementById("day-popup");
const popupDate = document.getElementById("popup-date");
const popupPosition = document.getElementById("popup-position");
const popupOvertime = document.getElementById("popup-overtime");
const popupSave = document.getElementById("popup-save");
const popupCancel = document.getElementById("popup-cancel");
const popupNote = document.getElementById("popup-note");

const calendarTitle = document.getElementById("calendar-title");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const holidayEl = document.getElementById("holiday-days");
const sickEl = document.getElementById("sick-days");

const popupOvertimeFreeDay = document.getElementById("popup-overtime-free-day");

const extendedShiftPositions = ["S21", "S22", "S36", "S37", "S39", "S40", "S56"];

let workedDays = {};
let selectedSystem = parseInt(systemSelect.value);

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

let currentNoteOpen = null;

systemSelect.addEventListener("change", () => {
  selectedSystem = parseInt(systemSelect.value);
  renderCalendar();
});

popupCancel.addEventListener("click", () => popup.classList.add("hidden"));

popupSave.addEventListener("click", () => {
    const dateKey = popup.dataset.date;
    const position = popupPosition.value?.trim();
  
    if (!position) {
      alert("Wybierz stanowisko przed zapisaniem dnia.");
      return;
    }
  
  if (!workedDays[dateKey]) workedDays[dateKey] = {};

  workedDays[dateKey].worked = document.getElementById("popup-confirmed").checked;
  workedDays[dateKey].position = position;
  workedDays[dateKey].extraHours = parseInt(popupOvertime.value) || 0;
  workedDays[dateKey].isHoliday = document.getElementById("popup-holiday").checked;
  workedDays[dateKey].isSick = document.getElementById("popup-sick").checked;
  workedDays[dateKey].note = popupNote.value.trim();
  workedDays[dateKey].isFreeDayForOvertime = popupOvertimeFreeDay.checked;
  workedDays[dateKey].freeDayFromOvertime = popupOvertimeFreeDay.checked;

  popup.classList.add("hidden");
  renderCalendar();
});

document.getElementById("remove-note").addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  if (workedDays[dateKey]) {
    delete workedDays[dateKey].note;
    popupNote.value = "";
    renderCalendar();
  }
});

document.getElementById("remove-worked").addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  if (workedDays[dateKey]) {
    delete workedDays[dateKey].worked;
    document.getElementById("popup-confirmed").checked = false;
    renderCalendar();
  }
});

document.getElementById("remove-holiday").addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  if (workedDays[dateKey]) {
    delete workedDays[dateKey].isHoliday;
    document.getElementById("popup-holiday").checked = false;
    renderCalendar();
  }
});

document.getElementById("remove-sick").addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  if (workedDays[dateKey]) {
    delete workedDays[dateKey].isSick;
    document.getElementById("popup-sick").checked = false;
    renderCalendar();
  }
});

document.getElementById("remove-overtime").addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  if (workedDays[dateKey]) {
    workedDays[dateKey].extraHours = 0;
    popupOvertime.value = "";
    renderCalendar();
  }
});

document.getElementById("remove-all").addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  delete workedDays[dateKey];
  popup.classList.add("hidden");
  renderCalendar();
});

prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

function renderCalendar() {
  calendar.innerHTML = "";

  const today = new Date();
  const year = currentYear;
  const month = currentMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;

  const dayNames = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
  calendarTitle.textContent = formatFullDate(today, year, month);

  for (let i = 0; i < 7; i++) {
    const d = document.createElement("div");
    d.className = "day-header";
    d.textContent = dayNames[i];
    calendar.appendChild(d);
  }

  for (let i = 0; i < startWeekday; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const weekday = (date.getDay() + 6) % 7;
    const dateKey = `${year}-${month}-${day}`;
    const div = document.createElement("div");
    div.className = "day";

    if (weekday === 5 || weekday === 6) div.classList.add("weekend");

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      div.style.border = "2px solid darkred";
    }

    const info = workedDays[dateKey];

    // ✅ Automatyczne oznaczanie dni z przeszłości jako przepracowane
    if (date < today && info && (info.position || info.extraHours) && !info.worked) {
      info.worked = true;
    }

    if (info?.isHoliday) div.classList.add("holiday");
    if (info?.isSick) div.classList.add("sick");
    if (info?.isFreeDayForOvertime) div.classList.add("free-day");

    if (info?.worked) {
      div.classList.add("worked");
    } else if (info?.position || info?.extraHours) {
      div.classList.add("planned");
    }

    let html = `<strong>${day}</strong>`;
    if (info?.position) html += `<div class="info">${info.position}</div>`;
    if (info?.extraHours) html += `<div class="info">+${info.extraHours}h</div>`;
    if (info?.isHoliday) html += `<div class="info">URLOP</div>`;
    if (info?.isSick) html += `<div class="info">ZL</div>`;
    if (info?.isFreeDayForOvertime) html += `<div class="info">Wolne (nadgodziny)</div>`;
    if (!info?.worked && (info?.position || info?.extraHours)) html += `<div class="info">PLAN</div>`;
    if (info?.note) {
      html += `
        <svg class="note-icon" data-date="${dateKey}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#444">
          <path d="M4 2h14a2 2 0 0 1 2 2v11l-4-4H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 6h10v2H4V8zm0 4h8v2H4v-2z"/>
        </svg>
      `;
    }

    div.innerHTML = html;
    div.addEventListener("click", () => openPopup(dateKey, date));
    calendar.appendChild(div);

    if (info?.note) {
      div.querySelector(".note-icon").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleNote(dateKey, date);
      });
    }
  }

  updateSummary();
}

function renderPositionTable() {
  popupPosition.innerHTML = "";
  const table = document.createElement("table");
  table.className = "position-table-inner";

  let tr = document.createElement("tr");
  for (let i = 1; i <= 60; i++) {
    const td = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = `S${i}`;
    btn.setAttribute('data-position', `S${i}`);
    btn.className = "position-btn";
    btn.addEventListener("click", () => {
      document.querySelectorAll(".position-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      popupPosition.dataset.selected = `S${i}`;
    });
    td.appendChild(btn);
    tr.appendChild(td);

    if (i % 6 === 0) {
      table.appendChild(tr);
      tr = document.createElement("tr");
    }
  }
  popupPosition.appendChild(table);
}

function openPopup(dateKey, dateObj) {
  popup.classList.remove("hidden");
  popup.dataset.date = dateKey;
  popupDate.textContent = `${dateObj.getDate()}.${dateObj.getMonth() + 1}.${dateObj.getFullYear()}`;

  const info = workedDays[dateKey] || {};
  renderPositionTable();
  popupPosition.dataset.selected = info.position || "";
  if (info.position) {
    const activeBtn = [...document.querySelectorAll(".position-btn")].find(b => b.textContent === info.position);
    if (activeBtn) activeBtn.classList.add("selected");
  }

  popupOvertime.value = info.extraHours || "";
  popupNote.value = info.note || "";
  document.getElementById("popup-holiday").checked = !!info.isHoliday;
  document.getElementById("popup-sick").checked = !!info.isSick;
  popupOvertimeFreeDay.checked = !!info.isFreeDayForOvertime;

  const confirmedCheckbox = document.getElementById("popup-confirmed");
  confirmedCheckbox.checked = !!info.worked;
  confirmedCheckbox.disabled = false;
  confirmedCheckbox.parentElement.style.display = "block";
}

function updateSummary() {
  let hoursWorked = 0;
  let overtime = 0;
  let plannedHours = 0;
  let leaveDays = 0;
  let sickDays = 0;

  for (const key in workedDays) {
    const info = workedDays[key];
    if (!info) continue;

    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isExtended = extendedShiftPositions.includes(info.position);

    if (info.freeDayFromOvertime) {
      overtime -= 8;
      continue;
    }

    if (info.isHoliday) {
      leaveDays++;
      continue;
    }

    if (info.isSick) {
      sickDays++;
      continue;
    }

    const isPlanned = !info.worked;

    if (isPlanned) {
      plannedHours += isExtended ? 12 : 8;
    }

    if (info.worked) {
      if (isExtended) {
        hoursWorked += 12;
        overtime += isWeekend ? 12 : 4;
      } else {
        hoursWorked += 8;
        overtime += isWeekend ? 8 : 0;
      }

      overtime += info.extraHours || 0;
    }
  }

  workedEl.textContent = hoursWorked;
  overtimeEl.textContent = overtime;
  plannedEl.textContent = plannedHours;
  holidayEl.textContent = leaveDays;
  sickEl.textContent = sickDays;
}

function formatFullDate(today, year, month) {
  const currentView = new Date(year, month, today.getDate());
  const dayNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
  const monthNames = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  return `${dayNames[currentView.getDay()]}, ${currentView.getDate()} ${monthNames[currentView.getMonth()]} ${currentView.getFullYear()}`;
}

function toggleNote(dateKey, dateObj) {
  const display = document.getElementById("note-display");
  const content = document.getElementById("note-content");
  const dateText = document.getElementById("note-date");

  if (currentNoteOpen === dateKey) {
    display.classList.add("hidden");
    currentNoteOpen = null;
    return;
  }

  const info = workedDays[dateKey];
  if (!info?.note) return;

  dateText.textContent = `${dateObj.getDate()}.${dateObj.getMonth() + 1}.${dateObj.getFullYear()}`;
  content.textContent = info.note;
  display.classList.remove("hidden");
  currentNoteOpen = dateKey;
}

renderCalendar();


const dayPopup = document.getElementById('day-popup');
const positionPopup = document.getElementById('position-popup');
const positionSelect = document.getElementById('popup-position');

// Otwórz popup ze stanowiskami
document.getElementById('show-positions-btn').addEventListener('click', () => {
  dayPopup.classList.add('hidden');
  positionPopup.classList.remove('hidden');
});

// Kliknięcie w stanowisko (S1–S60)
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('position-btn')) {
    const pos = e.target.getAttribute('data-position');
    let optionExists = false;

    // Sprawdź, czy opcja istnieje, jeśli nie – dodaj
    for (let opt of positionSelect.options) {
      if (opt.value === pos) {
        optionExists = true;
        break;
      }
    }

    if (!optionExists) {
      const newOption = document.createElement('option');
      newOption.value = pos;
      newOption.textContent = pos;
      positionSelect.appendChild(newOption);
    }

    // Ustaw jako wybraną
    positionSelect.value = pos;

    // Zamknij popup stanowisk, pokaż główny popup
    positionPopup.classList.add('hidden');
    dayPopup.classList.remove('hidden');
  }
});

// Anuluj wybór stanowiska
document.getElementById('cancel-position-select').addEventListener('click', () => {
  positionPopup.classList.add('hidden');
  dayPopup.classList.remove('hidden');
});
