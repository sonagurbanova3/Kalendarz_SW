const calendar = document.getElementById("calendar");
const systemSelect = document.getElementById("system");
const workedEl = document.getElementById("worked-hours");
const overtimeEl = document.getElementById("overtime");
const plannedEl = document.getElementById("planned-hours");

const popup = document.getElementById("day-popup");
const popupDate = document.getElementById("popup-date");
const popupPosition = document.getElementById("popup-position"); // ukryte pole
const popupPositionGrid = document.getElementById("popup-position-grid"); // nowa siatka
const popupOvertime = document.getElementById("popup-overtime");
const popupSave = document.getElementById("popup-save");
const popupCancel = document.getElementById("popup-cancel");

const calendarTitle = document.getElementById("calendar-title");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const holidayEl = document.getElementById("holiday-days");
const sickEl = document.getElementById("sick-days");

const extendedShiftPositions = ["S21", "S22", "S36", "S37", "S39", "S40", "S56"];
let workedDays = {};
let selectedSystem = parseInt(systemSelect.value);

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

systemSelect.addEventListener("change", () => {
  selectedSystem = parseInt(systemSelect.value);
  renderCalendar();
});

popupCancel.addEventListener("click", () => popup.classList.add("hidden"));

// === ZAMIANA SELECTA NA GRID Z BUTTONAMI ===
for (let i = 1; i <= 60; i++) {
  const btn = document.createElement("button");
  const val = `S${i}`;
  btn.textContent = val;
  btn.addEventListener("click", () => {
    popupPosition.value = val;
    [...popupPositionGrid.children].forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
  popupPositionGrid.appendChild(btn);
}

// ZMIANA: zawsze zapisuj po kliknięciu "Zapisz", niezależnie od daty
popupSave.addEventListener("click", () => {
  const dateKey = popup.dataset.date;
  if (!workedDays[dateKey]) workedDays[dateKey] = {};

  workedDays[dateKey].worked = document.getElementById("popup-confirmed").checked;
  workedDays[dateKey].position = popupPosition.value;
  workedDays[dateKey].extraHours = parseInt(popupOvertime.value) || 0;
  workedDays[dateKey].isHoliday = document.getElementById("popup-holiday").checked;
  workedDays[dateKey].isSick = document.getElementById("popup-sick").checked;

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
    if (info?.isHoliday) div.classList.add("holiday");
    if (info?.isSick) div.classList.add("sick");
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
    if (!info?.worked && (info?.position || info?.extraHours)) html += `<div class="info">PLAN</div>`;

    div.innerHTML = html;
    div.addEventListener("click", () => openPopup(dateKey, date));
    calendar.appendChild(div);
  }

  updateSummary();
}

function openPopup(dateKey, dateObj) {
  popup.classList.remove("hidden");
  popup.dataset.date = dateKey;
  popupDate.textContent = `${dateObj.getDate()}.${dateObj.getMonth() + 1}.${dateObj.getFullYear()}`;

  const info = workedDays[dateKey] || {};
  popupPosition.value = info.position || "";

  // zaznacz aktywny przycisk
  [...popupPositionGrid.children].forEach(btn => {
    if (btn.textContent === popupPosition.value) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });

  popupOvertime.value = info.extraHours || "";
  document.getElementById("popup-holiday").checked = !!info.isHoliday;
  document.getElementById("popup-sick").checked = !!info.isSick;

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

renderCalendar();
