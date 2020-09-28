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
		id: null 
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
	taskName: ''
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
	const timer = getTimerValue().replace(/:/g, '')
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
	const { timer } = state
	const newValue = timer.s + ms / 1000
	
	if (newValue >= 60) {
		timer.s = 0
		timer.m ++
	} else {
		timer.s += ms / 1000
	}
	if (timer.m >= 60) {
		timer.m = 0
		timer.h ++
	}
	if (timer.h >= 99) {
		timer.h = 0
	}

	renderTimer()
}

function startTimer (ms = 1000) {
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
    		<span contenteditable="true">${value}</span>
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
  	const timeElement = this.firstElementChild
  	timeElement.focus()
  	timeElement.addEventListener('blur', function (e) {
  		state.aside.tasks[title].time = this.textContent
  		localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks))
  		init()	
  	})
  	timeElement.addEventListener('input', function (e) {
  		this.textContent = e.target.textContent.replace(/[^\d:]/g, '')
  	})
  })

  return card
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
