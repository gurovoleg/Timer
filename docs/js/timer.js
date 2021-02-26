// const
const timerElement = document.getElementById('timer')
const timerElements = document.querySelectorAll('.block-element')
const form = document.getElementById('form')
const addInput = document.getElementById('formInput')
const searchInput = document.getElementById('search')
const aside = document.getElementById('aside')
const asideContent = document.getElementById('asideContent')
const asideWrapper = document.querySelector('.aside-wrapper')
const startButton = document.getElementById('start')
const stopButton = document.getElementById('stop')
const resetButton = document.getElementById('reset')
const submitButton = document.getElementById('submit')
const compactAside = document.getElementById('compactAside')
const clearStorageButton = document.getElementById('clearStorage')
const disabled = 'disabled'
const showAside = 'aside--show'
const developmentMode = true

const state = {
	timer: { 
		h: 0,	
		m: 0,	
		s: 0, 
		id: null,
		add: 0, // сохранненый промежуток времени в мс
		start: 0  // стартовое время счетчика (используем для подсчета интервела: текущее значение - стартовое)
	},
	controls: {
		start: true,
		stop: false,
	},
	aside: {
		show: false,
		compact: false,
		tasks: {}
	},
	filter: {
		search: ''
	},
	taskName: '',
	editedvalue: '',
	carriagePosition: 0,
	keyCode: undefined
}

// test mode
if (!developmentMode) {
	const data = generateMockData()
	setMockData(data)
}


async function init () {
	state.aside.tasks = await getStorage()
	fixStorage()
  state.aside.show = Object.keys(state.aside.tasks).length > 0
	render()
}

// Удалить пустые ключи
function fixStorage () {
	delete state.aside.tasks['']
	localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks))
}

// render global
function render () {
	renderControls()
	renderAside()
}

// render Timer controls
function renderControls () {
	const { taskName, start, stop } = state.controls
	addInput.value = state.taskName
	state.taskName.trim() ? submitButton.classList.remove(disabled) : submitButton.classList.add(disabled)
	start ? startButton.classList.remove(disabled) : startButton.classList.add(disabled)
	stop ? stopButton.classList.remove(disabled) : stopButton.classList.add(disabled)
}

// render Aside
function renderAside (update = true) {
	if (update) {
		asideContent.innerHTML = ''
		const data = Object.entries(state.aside.tasks).filter(([key, value]) => { 
			return key.includes(state.filter.search) || value.date.includes(state.filter.search) 
		})
		for(let item of data) {
			asideContent.append(createCardElement(item[1].date, item[0], item[1].time))
		}
	}
	
	// show/hide Aside
	state.aside.show ? aside.classList.add(showAside) : aside.classList.remove(showAside)

	// set Aside compact 
	if (state.aside.compact) {
		aside.classList.add('aside--compact')
		asideWrapper.classList.add('d-none')
		compactAside.classList.add('icon--rotate')	
	} else {
		aside.classList.remove('aside--compact')
		asideWrapper.classList.remove('d-none')
		compactAside.classList.remove('icon--rotate')	
	}
	
}

// render Timer
function renderTimer () {
	let timer = getTimerValue()
	document.title = timer
	timer = timer.replace(/:/g, '')
	timerElements.forEach((el, idx) => {
		el.innerHTML = timer[idx]
	})
}

function getTimerValue() {
	const { timer } = state

	const hh = formatValue(timer.h)
	const mm = formatValue(timer.m)
	const ss = formatValue(timer.s)

	return `${hh}:${mm}:${ss}`
}

function formatValue (value) {
	return value > 9 ? value.toString() : `0${value}`
}

// data processing
function updateTimer (ms) {
	/*
	  Замер временного промежутка делаем с привязкой к текущему значению времени, т.е. высчитываем разницу
	  между текущим моментом времени и начальным, когда таймер был запущен. До этого альтернативаный 
	  вариант - обновление таймера по счетчику (+ 1000мс) - получалась задержка таймера и некорректный результат
	*/
	const { timer } = state
	const current = Date.now()
	const diff = current - timer.start // получаем разницу между текущим моментом временем и стартовым, когда был запущен таймер
	const value = timer.add + diff // добавляем начальное значение таймера, если оно было задано, т.е. продолжаем работу с какого-то момента времени

	const time = convertToTimeFormat(value)
	Object.assign(timer, time)

	renderTimer()
}

function convertToMilliseconds (timer = state.timer) {
	return timer.h * 3600000 + timer.m * 60000 + timer.s * 1000
}

function convertToTimeFormat (ms, formatter) {
	return {
		s: formatter ? formatter(Math.floor((ms / 1000) % 60)) : Math.floor((ms / 1000) % 60),
		m: formatter ? formatter(Math.floor((ms / 60000) % 60)) : Math.floor((ms / 60000) % 60),
		h: formatter ? formatter(Math.floor((ms / 3600000) % 60)) : Math.floor((ms / 3600000) % 24),
	}
}

function startTimer (ms = 1000) {
	state.timer.start = Date.now()
	state.timer.add = convertToMilliseconds()	
	console.log(state.timer)
	return setInterval(() => updateTimer(ms), ms)
}

function stopTimer () {
	clearInterval(state.timer.id)
	state.controls.start = true
	state.controls.stop = false
	renderControls()
}

function resetTimer () {
	state.timer = { h: 0, m: 0, s: 0 }
	renderTimer()
}

function createCardElement (date, title, value) {
	title = title || 'Нет названия'
	
	const card = document.createElement('div')
	card.className = 'card'
	
	const icon = document.createElement('i')
	icon.className = 'close icon icon--absolute'
	icon.addEventListener('click', function (e) {
		e.stopPropagation()
		this.parentNode.classList.add('card--hide')
		setTimeout(() => {
			delete state.aside.tasks[title]
			localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks))
			init()	
		}, 700)
	})
	
	card.append(icon)
	
	const rest = `
		<i class="stopwatch icon bounce"></i>
    <i class="play icon"></i>
    <div class="card-content">
	  	<div class="date">${date}</div>
    	<div id="cardTime" class="time" title="Редактировать">
    		<span id="editableTimer" contenteditable="true">${value}</span>
    		<i class="pencil alternate icon"></i>
    	</div>
    	<div class="description">${title}</div>
    </div>`

  // запуск продолжения старого задания
  card.addEventListener('click', function () {
  	const timer = value.split(':').map(str => Number(str))
  	state.timer = {
  		...state.timer,
  		h: timer[0],
  		m: timer[1],
  		s: timer[2],
  	}
  	state.taskName = title
  	stopTimer()
  	renderTimer()
  	document.querySelector('.main').classList.add('flipInX')
  	setTimeout(() => {
  		document.querySelector('.main').classList.remove('flipInX')
  	}, 700)
  })  
  
  card.insertAdjacentHTML('beforeEnd', rest)

	// Добавляем обработчик для редактирования времени
	const timeBlock = card.querySelector('#cardTime')

  timeBlock.addEventListener('click', function (e) {
  	e.stopPropagation()

  	state.editedvalue = value // добавляем в state текущее значение таймера задачи, чтобы возвращать старое значение в случае неверного ввода
  	this.style.color = 'blue' // меняем цвет текста
  	// добавляем для режима редактирования многоточие, если еще не было добавлено (кол-во детей у родителя равно 2)
  	if (this.children.length === 2) {
  		this.insertAdjacentHTML('beforeend', '<span>...</span>')	
  	}
  	const timeElement = this.firstElementChild
  	timeElement.focus()
  	timeElement.addEventListener('blur', () => blurHandler(timeElement, title))
  	timeElement.addEventListener('input', e => updateTimerHandler(e.target.textContent, timeElement) )
  	timeElement.addEventListener('keydown', e => state.keyCode = e.keyCode)
  })

  return card
}

// обработчик blur после редактирования таймера
function blurHandler (element, title) {
	let values = element.textContent.split(':')
	const formatValue = (value) => value.length === 0 ? '00' : value.length === 1 ? `0${value}` : value

	newValue = values.map(value => formatValue(value)).join(':')

	element.textContent = newValue
	state.aside.tasks[title].time = newValue
	state.aside.tasks[title].date = new Date().toLocaleString("ru")
	localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks))
	init()	
}

// обработчик вводимых данных
function updateTimerHandler (value, element) {
	const currentValue = state.editedvalue
	const selection = window.getSelection();
	state.carriagePosition = selection.focusOffset; // задаем текущее положение каретки
	const values = value.replace(/[^\d:]/g, '').split(':')
	
	if (values.length !== 3 || values.filter((value, idx) => (value.length > 2) || (idx !== 0 && value > 59)).length) {
		element.textContent = state.editedvalue
	} else {
		element.textContent = values.join(':')	
		state.editedvalue = element.textContent // Обновляем в state значение таймера задачи
	}
	setCarriagePosition(currentValue, state.editedvalue, element.childNodes[0])
}

// Задаем расположение каретки
function setCarriagePosition (value, nextValue, element) {
  // Если значение поля в итоге не поменялось, но что-то нажато было, смещаем каретку согласно правилам:
  // backspace и пробел - без изменений, delete - вперёд, всё остальное - возвращаем каретку на 1 назад
  if (value === nextValue) {
  	switch (state.keyCode) {
  	  case 46: // delete
  	    state.carriagePosition ++
  	    break
  	  case 8:   // backspace
  	  case 32:  // пробел
  	    break
  	  default:
  	    state.carriagePosition --
  	}
  }

  const selection = window.getSelection();
  const range = document.createRange()
  range.setStart(element, state.carriagePosition);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}

function getStorage () {
	return new Promise((res, err) => {
		const storage = JSON.parse(localStorage.getItem(storageKey)) || {}
		res(storage)	
	})
}

// eventListeners
startButton.addEventListener('click', function () {
	state.timer.id = startTimer()
	console.log(state.timer)
	state.controls.start = false
	state.controls.stop = true
	renderControls()
})

stopButton.addEventListener('click', stopTimer)

resetButton.addEventListener('click', function () {
	stopTimer()
	resetTimer()
})

// delete all from Aside
clearStorageButton.addEventListener('click', function () {
	localStorage.clear(storageKey)
	init()
})

addInput.addEventListener('input', function () {
	state.taskName = this.value 
	renderControls()	
})

// add task to Aside
form.addEventListener('submit', function (e) {
	e.preventDefault()
	state.aside.tasks[addInput.value.trim()] = {
		time: getTimerValue(),
		date: new Date().toLocaleString("ru")
	}
	localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks))
	init()	
})

// filter
searchInput.addEventListener('input', function () {
	state.filter.search = this.value
	renderAside()
})

compactAside.addEventListener('click', function () {
	state.aside.compact = !state.aside.compact
	renderAside(false)
})

document.addEventListener('DOMContentLoaded', function() {
  init()
}, false);
