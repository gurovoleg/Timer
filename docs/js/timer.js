const version = "3.0";
const storageKey = "timer";
const infoMessageStorageKey = "showInfoMessage";
const versionStorageKey = "app_version";
const themeStorageKey = "theme";
const asideHideStorageKey = "aside_settings_hide";

const timerBlock = document.getElementById("timer-wrapper");
const timerElement = document.getElementById("timer");
const timerElements = document.querySelectorAll(".block-element");
const form = document.getElementById("form");
const addInput = document.getElementById("formInput");
const searchInput = document.getElementById("search");
const aside = document.getElementById("aside");
const asideContent = document.getElementById("asideContent");
const asideWrapper = document.querySelector(".aside-wrapper");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const resetButton = document.getElementById("reset");
const submitButton = document.getElementById("submit");
const themeToggleButton = document.getElementById("theme-toggle-button");
const compactAside = document.getElementById("compactAside");
const clearStorageButton = document.getElementById("clearStorage");
const modalWrapper = document.getElementById("modal-wrapper");
const modalCloseButton = document.getElementById("modal-close");
const modalCheckbox = document.getElementById("modal-checkbox");
const timerBlockSeparators = document.querySelectorAll(".block-separator");

const disabled = "disabled";
const showAside = "aside--show";
const addMockData = false;

Sortable.create(asideContent, {
  group: "aside-items",
  onEnd: sortTasksOnDragNDrop,
});

const state = {
  timer: {
    h: 0,
    m: 0,
    s: 0,
    id: null,
    add: 0, // сохранненый промежуток времени в мс
    start: 0, // стартовое время счетчика (используем для подсчета интервела: текущее значение - стартовое)
  },
  controls: {
    start: true,
    stop: false,
  },
  aside: {
    show: false,
    compact: false,
    tasks: [],
  },
  filter: {
    search: "",
  },
  taskName: "",
  editedvalue: "",
  carriagePosition: 0,
  keyCode: undefined,
  enableTimerBlockTransformation: true,
};

if (addMockData) {
  const data = generateMockData();
  setMockData(data);
}

async function init() {
  const storage = await getStorage();
  const fixedStorage = fixStorageToArray(storage); // legacy data fix

  state.aside.tasks = fixedStorage;
  state.aside.show = fixedStorage.length > 0;

  render();
}

function fixStorageToArray(storage) {
  const isObjectStorage =
    Object.prototype.toString.call(storage) === "[object Object]";

  if (isObjectStorage) {
    const result = [];

    Object.entries(storage).forEach(([key, value]) => {
      if (value) {
        result.push({ name: key, ...value });
      }
    });

    localStorage.setItem(storageKey, JSON.stringify(result));

    return result;
  }

  return storage;
}

// render global
function render() {
  renderControls();
  renderAside();
}

// render Timer controls
function renderControls() {
  const { start, stop } = state.controls;

  addInput.value = state.taskName;
  addInput.style.height = "auto";

  if (addInput.value) {
    addInput.style.height = addInput.scrollHeight + 4 + "px";
  }

  state.taskName.trim()
    ? submitButton.classList.remove(disabled)
    : submitButton.classList.add(disabled);
  start
    ? startButton.classList.remove(disabled)
    : startButton.classList.add(disabled);
  stop
    ? stopButton.classList.remove(disabled)
    : stopButton.classList.add(disabled);
}

// render Aside
function renderAside(update = true) {
  if (update) {
    asideContent.innerHTML = "";

    const data = state.aside.tasks.filter(({ name, date }) => {
      return (
        name.includes(state.filter.search) || date.includes(state.filter.search)
      );
    });

    for (let item of data) {
      asideContent.append(createCardElement(item.date, item.name, item.time));
    }
  }

  // show/hide Aside
  setTimeout(() => {
    state.aside.show
      ? aside.classList.add(showAside)
      : aside.classList.remove(showAside);

    // set Aside compact
    if (state.aside.compact) {
      aside.classList.add("aside--compact");
      asideWrapper.classList.add("d-none");
      compactAside.classList.add("icon--rotate");
    } else {
      aside.classList.remove("aside--compact");
      asideWrapper.classList.remove("d-none");
      compactAside.classList.remove("icon--rotate");
    }
  }, 100);
}

// render Timer
function renderTimer() {
  let timer = getTimerValue();
  document.title = timer;
  timer = timer.replace(/:/g, "");
  timerElements.forEach((el, idx) => {
    el.innerHTML = timer[idx];
  });
}

function getTimerValue() {
  const { timer } = state;

  const hh = formatValue(timer.h);
  const mm = formatValue(timer.m);
  const ss = formatValue(timer.s);

  return `${hh}:${mm}:${ss}`;
}

function formatValue(value) {
  return value > 9 ? value.toString() : `0${value}`;
}

// data processing
function updateTimer(ms) {
  /*
	  Замер временного промежутка делаем с привязкой к текущему значению времени, т.е. высчитываем разницу
	  между текущим моментом времени и начальным, когда таймер был запущен. До этого альтернативаный 
	  вариант - обновление таймера по счетчику (+ 1000мс) - получалась задержка таймера и некорректный результат
	*/
  const { timer } = state;
  const current = Date.now();
  const diff = current - timer.start; // получаем разницу между текущим моментом временем и стартовым, когда был запущен таймер
  const value = timer.add + diff; // добавляем начальное значение таймера, если оно было задано, т.е. продолжаем работу с какого-то момента времени

  const time = convertToTimeFormat(value);
  Object.assign(timer, time);

  renderTimer();
}

function convertToMilliseconds(timer = state.timer) {
  return timer.h * 3600000 + timer.m * 60000 + timer.s * 1000;
}

function convertToTimeFormat(ms, formatter) {
  return {
    s: formatter
      ? formatter(Math.floor((ms / 1000) % 60))
      : Math.floor((ms / 1000) % 60),
    m: formatter
      ? formatter(Math.floor((ms / 60000) % 60))
      : Math.floor((ms / 60000) % 60),
    h: formatter
      ? formatter(Math.floor((ms / 3600000) % 60))
      : Math.floor((ms / 3600000) % 24),
  };
}

function startTimer(ms = 1000) {
  state.timer.start = Date.now();
  state.timer.add = convertToMilliseconds();

  timerBlockSeparators.forEach((element) => {
    element.classList.add("opacity-infinity");
  });

  return setInterval(() => updateTimer(ms), ms);
}

function stopTimer() {
  clearInterval(state.timer.id);
  state.controls.start = true;
  state.controls.stop = false;

  timerBlockSeparators.forEach((element) => {
    element.classList.remove("opacity-infinity");
  });

  renderControls();
}

function resetTimer() {
  state.timer = { h: 0, m: 0, s: 0 };
  renderTimer();
}

function createCardElement(date, title, value) {
  title = title || "Unknown";

  const card = document.createElement("div");
  card.className = "card";
  card.title = "Drag'n drop to sort";

  const rest = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon-close icon--absolute">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path
        d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-6.489 5.8a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z" />
    </svg>
		<div class="card-icons">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" class="icon-stopwatch">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M5 13a7 7 0 1 0 14 0a7 7 0 0 0 -14 0z" />
        <path d="M14.5 10.5l-2.5 2.5" />
        <path d="M17 8l1 -1" />
        <path d="M14 3h-4" />
      </svg>

      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon-play">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
      </svg>
    </div>  
    <div class="card-content">
	  	<div class="date">${date}</div>
    	<div id="cardTime" class="time" title="Double-click to edit">
    		<span id="editableTimer">${value}</span>

        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round" class="icon-edit">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
          <path d="M13.5 6.5l4 4" />
        </svg>
    </div>
    	<div id="cardTitle" class="description" title="Double-click to edit">${title}</div>
    </div>`;

  card.insertAdjacentHTML("beforeEnd", rest);

  const closeIcon = card.querySelector(".icon-close");

  // remove task from tasks
  closeIcon.addEventListener("click", function (e) {
    e.stopPropagation();
    this.parentNode.classList.add("card--hide");

    setTimeout(() => {
      state.aside.tasks = state.aside.tasks.filter(
        (item) => item.name !== title
      );

      localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks));

      init();
    }, 700);
  });

  const playIcon = card.querySelector(".icon-play");

  playIcon.addEventListener("click", function () {
    const timer = value.split(":").map((str) => Number(str));
    state.timer = {
      ...state.timer,
      h: timer[0],
      m: timer[1],
      s: timer[2],
    };
    state.taskName = title;

    stopTimer();
    renderTimer();

    document.querySelector(".main").classList.add("flipInX");

    setTimeout(() => {
      document.querySelector(".main").classList.remove("flipInX");
    }, 700);
  });

  // time edit handler
  const timeBlock = card.querySelector("#cardTime");

  timeBlock.addEventListener("dblclick", function (e) {
    e.stopPropagation();

    state.editedvalue = value; // add current value to state to return it if input is invalid

    if (this.children.length === 2) {
      // this.insertAdjacentHTML("beforeend", "<span>...</span>");
    }
    const timeElement = this.firstElementChild;
    timeElement.classList.add("edit-mode");
    timeElement.contentEditable = true;
    timeElement.focus();
    timeElement.addEventListener("blur", () => blurHandler(timeElement, title));
    timeElement.addEventListener("input", (e) =>
      updateTimerHandler(e.target.textContent, timeElement)
    );
    timeElement.addEventListener("keydown", (e) => (state.keyCode = e.keyCode));
  });

  // title edit handler
  const cardTitle = card.querySelector("#cardTitle");

  cardTitle.addEventListener("dblclick", function (e) {
    e.stopPropagation();

    this.contentEditable = true;
    this.focus();

    this.classList.add("edit-mode");
  });

  cardTitle.addEventListener("blur", function (e) {
    const newTitle = e.target.textContent;

    if (newTitle && newTitle !== title) {
      const task = state.aside.tasks.find((item) => item.name === title);
      task.name = newTitle;

      localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks));

      init();
    } else {
      this.classList.remove("edit-mode");
      this.contentEditable = false;
    }
  });

  return card;
}

// time onBlur handler
function blurHandler(element, title) {
  const values = element.textContent.split(":");
  const formatValue = (value) =>
    value.length === 0 ? "00" : value.length === 1 ? `0${value}` : value;

  const newValue = values.map((value) => formatValue(value)).join(":");

  const task = state.aside.tasks.find((item) => item.name === title);

  if (task.time === newValue) {
    element.textContent = task.time;
    element.classList.remove("edit-mode");
    element.contentEditable = false;

    return;
  }

  task.time = newValue;
  task.date = new Date().toLocaleString("ru");

  localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks));
  init();
}

// input time handler
function updateTimerHandler(value, element) {
  const selection = window.getSelection();
  state.carriagePosition = selection.focusOffset; // set carriage current position

  const currentValue = state.editedvalue;
  const values = value.replace(/[^\d:]/g, "").split(":");

  if (
    values.length !== 3 ||
    values.filter((value, idx) => value.length > 2 || (idx !== 0 && value > 59))
      .length
  ) {
    element.textContent = state.editedvalue;
  } else {
    // element.textContent = values.join(":");
    state.editedvalue = element.textContent; // update state edited value
  }

  setCarriagePosition(currentValue, state.editedvalue, element.childNodes[0]);
}

// Update carriage position
function setCarriagePosition(value, nextValue, element) {
  // If no changes but smth is pressed then use the following logic:
  // backspace and space - no changes, delete - move forward, other - move back
  if (value === nextValue) {
    switch (state.keyCode) {
      case 46: // delete
        state.carriagePosition++;
        break;
      case 8: // backspace
      case 32: // space
        break;
      default:
        state.carriagePosition--;
    }
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(element, state.carriagePosition);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getStorage() {
  return new Promise((resolve) => {
    const storage = JSON.parse(localStorage.getItem(storageKey)) || [];

    resolve(storage);
  });
}

function sortTasksOnDragNDrop(event) {
  const orderedItems = Array.from(event.to.children);

  let updatedItems = orderedItems
    .map((item) => {
      const name = item.querySelector("#cardTitle").textContent;
      const task = state.aside.tasks.find((item) => item.name === name);

      if (task) {
        return { ...task };
      }

      return null;
    })
    .filter(Boolean);

  // possible when use search filter
  if (updatedItems.length < state.aside.tasks.length) {
    const missingItems = state.aside.tasks.filter((task) => {
      return !updatedItems.find((item) => item.name === task.name);
    });

    updatedItems = [...updatedItems, ...missingItems];
  }

  localStorage.setItem(storageKey, JSON.stringify(updatedItems));

  init();
}

function renderInfoMessage() {
  const showInfoMessage = localStorage.getItem(infoMessageStorageKey) === "1";

  if (!showInfoMessage) {
    modalWrapper.classList.remove("d-none");
  }
}

function validateCurrentVersion() {
  const foundVersion = localStorage.getItem(versionStorageKey);

  if (foundVersion !== version) {
    localStorage.setItem(versionStorageKey, version);
    localStorage.setItem(infoMessageStorageKey, 0);
  }
}

function setTheme() {
  const theme = localStorage.getItem(themeStorageKey) || "dark";

  document.documentElement.setAttribute("data-theme", theme);

  if (theme === "dark") {
    themeToggleButton.firstElementChild.classList.remove("d-none");
    themeToggleButton.lastElementChild.classList.add("d-none");
  } else {
    themeToggleButton.firstElementChild.classList.add("d-none");
    themeToggleButton.lastElementChild.classList.remove("d-none");
  }
}

// eventListeners
document.addEventListener(
  "DOMContentLoaded",
  function () {
    validateCurrentVersion();
    renderInfoMessage();
    setTheme();
    init();
  },
  false
);

themeToggleButton.addEventListener("click", function () {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const isDark = currentTheme === "dark";

  if (isDark) {
    html.setAttribute("data-theme", "light");
    this.firstElementChild.classList.add("d-none");
    this.lastElementChild.classList.remove("d-none");
  } else {
    html.setAttribute("data-theme", "dark");
    this.firstElementChild.classList.remove("d-none");
    this.lastElementChild.classList.add("d-none");
  }

  localStorage.setItem(themeStorageKey, isDark ? "light" : "dark");
});

startButton.addEventListener("click", function () {
  state.timer.id = startTimer();
  state.controls.start = false;
  state.controls.stop = true;
  renderControls();
});

stopButton.addEventListener("click", stopTimer);

resetButton.addEventListener("click", function () {
  stopTimer();
  resetTimer();
});

// delete all from Aside
clearStorageButton.addEventListener("click", function () {
  localStorage.clear(storageKey);
  init();
});

addInput.addEventListener("input", function () {
  state.taskName = this.value;

  renderControls();
});

addInput.addEventListener("focus", function () {
  resetTimerBlockAnimationStyles();

  state.enableTimerBlockTransformation = false;
});

addInput.addEventListener("blur", function () {
  state.enableTimerBlockTransformation = true;
});

// add task to Aside
submitButton.addEventListener("click", function (e) {
  e.preventDefault();

  const name = addInput.value.trim();

  if (!name) {
    return;
  }

  const existsTask = state.aside.tasks.find((item) => item.name === name);

  if (existsTask) {
    existsTask.time = getTimerValue();
    existsTask.date = new Date().toLocaleString("ru");
  } else {
    state.aside.tasks.push({
      name: addInput.value.trim(),
      time: getTimerValue(),
      date: new Date().toLocaleString("ru"),
    });
  }

  localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks));
  init();
});

// filter
searchInput.addEventListener("input", function () {
  state.filter.search = this.value;
  renderAside();
});

compactAside.addEventListener("click", function () {
  state.aside.compact = !state.aside.compact;
  renderAside(false);
});

modalCloseButton.addEventListener("click", function () {
  modalWrapper.classList.add("d-none");
});

modalCheckbox.addEventListener("change", function (event) {
  localStorage.setItem(infoMessageStorageKey, event.target.checked ? 1 : 0);
});

// timer block animation
function resetTimerBlockAnimationStyles() {
  if (!state.enableTimerBlockTransformation) {
    return;
  }

  timerBlock.style.transform = "rotateX(0deg) rotateY(0deg)";
  // timerBlock.style.setProperty("--highlight-x", "50%"); // left
  // timerBlock.style.setProperty("--highlight-y", "100%"); // top
}

function updateTimerBlockAnimationStyles(e) {
  if (!state.enableTimerBlockTransformation) {
    return;
  }

  const { width, height, left, top } = timerBlock.getBoundingClientRect();
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const distX = (mouseX - centerX) / (width / 2);
  const distY = (mouseY - centerY) / (height / 2);

  const rotateX = distY * 3; // Change to adjust rotation intensity
  const rotateY = distX * -3; // Change to adjust rotation intensity

  this.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  // Move the highlight
  const highlightX = ((mouseX - left) / width) * 100;
  const highlightY = ((mouseY - top) / height) * 100;

  this.style.setProperty("--highlight-x", `${highlightX}%`);
  this.style.setProperty("--highlight-y", `${highlightY}%`);
}

timerBlock.addEventListener("mousemove", updateTimerBlockAnimationStyles);
timerBlock.addEventListener("mouseleave", resetTimerBlockAnimationStyles);
