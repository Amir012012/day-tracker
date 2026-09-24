let totalDays = 155; // تعداد کل روزها
let checkedDays = JSON.parse(localStorage.getItem("checkedDays")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let notes = JSON.parse(localStorage.getItem("notes")) || {};

const daysContainer = document.getElementById("days");
const remainingEl = document.getElementById("remaining");
const progressFill = document.getElementById("progress");
const undoBtn = document.getElementById("undo");
const titleEl = document.querySelector("h1");

let progressChart;

// ---------- ایجاد نمودار ----------
function initChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");
  progressChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["فعال", "تعطیل", "آینده"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#4caf50", "#f44336", "#ddd"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              size: 13, // اندازه فونت دلخواه
              family: "Vazirmatn", // میتونی فونت دلخواه هم انتخاب کنی
            },
          },
        },
      },
    },
  });
}

// ---------- آپدیت عنوان ----------
function updateTitle() {
  titleEl.textContent = `چالش ${totalDays} روزه`;
}

// ---------- رندر کردن روزها ----------
function renderDays() {
  daysContainer.innerHTML = "";

  const sortedChecked = [...checkedDays].sort((a, b) => a - b);

  for (let i = 1; i <= totalDays; i++) {
    const day = document.createElement("div");
    day.classList.add("day");

    // تعیین رنگ روز
    if (checkedDays.includes(i)) {
      day.classList.add("checked");
    } else {
      let isRed = false;
      for (let j = 0; j < sortedChecked.length - 1; j++) {
        if (i > sortedChecked[j] && i < sortedChecked[j + 1]) {
          isRed = true;
          break;
        }
      }
      if (!isRed && sortedChecked.length > 0 && i < sortedChecked[0]) {
        isRed = true;
      }

      if (isRed) {
        day.classList.add("red");
      } else {
        day.classList.add("future");
      }
    }

    // شماره روز
    day.textContent = i;

    // یادداشت
    if (notes[i]) {
      day.classList.add("has-note");
      day.title = notes[i];
    } else {
      day.title = "";
    }

    // کلیک چپ: تیک زدن/برداشتن
    day.addEventListener("click", () => {
      if (day.classList.contains("checked")) {
        day.classList.remove("checked");
        checkedDays = checkedDays.filter((d) => d !== i);
        history.push({ action: "uncheck", day: i });
      } else {
        day.classList.add("checked");
        checkedDays.push(i);
        history.push({ action: "check", day: i });
      }
      saveData();
      updateStats();
      renderDays();
    });

    // کلیک راست: اضافه/ویرایش یادداشت
    day.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const note = prompt("یادداشت روز " + i, notes[i] || "");
      if (note !== null) {
        notes[i] = note;
        localStorage.setItem("notes", JSON.stringify(notes));
        renderDays();
      }
    });

    daysContainer.appendChild(day);
  }

  // ---------- دکمه افزودن روز (+) ----------
  const addDay = document.createElement("div");
  addDay.classList.add("day", "future");
  addDay.textContent = "+";
  addDay.style.fontWeight = "bold";
  addDay.addEventListener("click", () => {
    totalDays++;
    renderDays();
    updateStats();
    updateTitle(); // آپدیت عنوان
  });
  daysContainer.appendChild(addDay);

  // ---------- دکمه حذف روز (-) ----------
  const removeDay = document.createElement("div");
  removeDay.classList.add("day", "future");
  removeDay.textContent = "-";
  removeDay.style.fontWeight = "bold";
  removeDay.addEventListener("click", () => {
    if (totalDays > 1) {
      checkedDays = checkedDays.filter((d) => d <= totalDays - 1);
      totalDays--;
      renderDays();
      updateStats();
      updateTitle(); // آپدیت عنوان
    }
  });
  daysContainer.appendChild(removeDay);
}

// ---------- به‌روزرسانی آمار ----------
function updateStats() {
  const sortedChecked = [...checkedDays].sort((a, b) => a - b);

  let green = checkedDays.length;
  let red = 0;
  let future = 0;

  for (let i = 1; i <= totalDays; i++) {
    if (checkedDays.includes(i)) continue;

    let isRed = false;
    for (let j = 0; j < sortedChecked.length - 1; j++) {
      if (i > sortedChecked[j] && i < sortedChecked[j + 1]) {
        isRed = true;
        break;
      }
    }
    if (!isRed && sortedChecked.length > 0 && i < sortedChecked[0]) {
      isRed = true;
    }

    if (isRed) {
      red++;
    } else {
      future++;
    }
  }

  // نمایش در صفحه
  const remaining = totalDays - green - red; // روزهای آینده
  remainingEl.textContent = remaining;

  // Progress Bar با سبز + قرمز
  const completedDays = green + red;
  const percent = (completedDays / totalDays) * 100;
  progressFill.style.width = percent + "%";

  // آپدیت نمودار
  if (progressChart) {
    progressChart.data.datasets[0].data = [green, red, future];
    progressChart.update();
  }

  // آمار دقیق
  document.getElementById("green-count").textContent = green;
  document.getElementById("red-count").textContent = red;
  document.getElementById("future-count").textContent = future;
}

// ---------- ذخیره در LocalStorage ----------
function saveData() {
  localStorage.setItem("checkedDays", JSON.stringify(checkedDays));
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("notes", JSON.stringify(notes));
}

// ---------- دکمه بازگردانی ----------
undoBtn.addEventListener("click", () => {
  const lastAction = history.pop();
  if (!lastAction) return;
  if (lastAction.action === "check") {
    checkedDays = checkedDays.filter((d) => d !== lastAction.day);
  } else if (lastAction.action === "uncheck") {
    checkedDays.push(lastAction.day);
  }
  saveData();
  renderDays();
  updateStats();
  updateTitle();
});

// ---------- Notification ساده ----------
if ("Notification" in window) {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      new Notification("یادت نره امروز روزتو تیک بزنی!");
    }
  });
}

// ---------- اجرای اولیه ----------
initChart();
renderDays();
updateStats();
updateTitle(); // آپدیت عنوان در شروع
