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
const minAside = document.getElementById('minAside')
const maxAside = document.getElementById('maxAside')
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
		submit: false,
	},
	aside: {
		show: false,
		compact: false,
		tasks: {}
	},
	filter: {
		search: ''
	}
}

// test mode
if (!developmentMode) {
	const data = generateMockData()
	setMockData(data)
}


async function init () {
	state.aside.tasks = await getStorage()
  state.aside.show = Object.keys(state.aside.tasks).length > 0
	render()
}

// render global
function render () {
	renderControls()
	renderAside()
}

// render Timer controls
function renderControls () {
	const { submit, start, stop } = state.controls
	submit ? submitButton.classList.remove(disabled) : submitButton.classList.add(disabled)
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
		maxAside.classList.remove('d-none')
		minAside.classList.add('d-none')	
	} else {
		aside.classList.remove('aside--compact')
		asideWrapper.classList.remove('d-none')
		maxAside.classList.add('d-none')
		minAside.classList.remove('d-none')	
	}
	
}

// render Timer
function renderTimer () {
	const timer = getTimerValue().replace(/:/g, '')
	timerElements.forEach((el, idx) => {
		el.innerHTML = timer[idx]
	})
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


function createCardElement (date, title, value) {
	title = !title || title === '' ? 'Нет названия' : title
	
	const card = document.createElement('div')
	card.className = 'card'
	
	const icon = document.createElement('i')
	icon.className = 'close icon icon--absolute'
	icon.addEventListener('click', function () {
		this.parentNode.classList.add('card--hide')
		setTimeout(() => {
			delete state.aside.tasks[title]
			localStorage.setItem(storageKey, JSON.stringify(state.aside.tasks))
			init()	
		}, 700)
	})
	
	card.append(icon)
	
	const rest = `
		<i class="stopwatch icon"></i>
    <div class="card-content">
	  	<div class="date">${date}</div>
    	<div class="time">${value}</div>
    	<div class="description">${title}</div>
    </div>`
  
  card.insertAdjacentHTML('beforeEnd', rest)  
  
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
	state.controls.submit = this.value !== ''
	renderControls()
})

// add task to Aside
form.addEventListener('submit', function (e) {
	e.preventDefault()
	state.aside.tasks[addInput.value] = {
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

minAside.addEventListener('click', function () {
	state.aside.compact = true
	renderAside(false)
})

maxAside.addEventListener('click', function () {
	state.aside.compact = false
	renderAside(false)
})

document.addEventListener('DOMContentLoaded', function() {
  init()
}, false);
