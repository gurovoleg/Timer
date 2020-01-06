// const
const timerElement = document.getElementById('timer')
const timerElements = document.querySelectorAll('.block-element')
const form = document.getElementById('form')
const input = document.getElementById('formInput')
const searchInput = document.getElementById('search')
const aside = document.getElementById('aside')
const asideContent = document.getElementById('asideContent')
const startButton = document.getElementById('start')
const stopButton = document.getElementById('stop')
const resetButton = document.getElementById('reset')
const submitButton = document.getElementById('submit')
const clearStorageButton = document.getElementById('clearStorage')
const disabled = 'disabled'
let timerId = null
let timer = { h: 0,	m: 0,	s: 0 }
let storage = {}
let searchString = ''

async function init () {
	storage = await getStorage()
  renderAside()
  if (Object.keys(storage).length > 0) {
		aside.classList.add('aside--show')
	} else {
		aside.classList.remove('aside--show')
	}
}

// data processing
function updateTimer (ms) {
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

function clearTimer () {
	timer = { h: 0, m: 0, s: 0 }
	renderTimer()
}

function stopTimer () {
	clearInterval(timerId)
	startButton.classList.remove(disabled)
	stopButton.classList.add(disabled)
}

// Render Timer
function renderTimer () {
	const timer = getTimerValue().replace(/:/g, '')
	console.log(timer)
	timerElements.forEach((el, idx) => {
		el.innerHTML = timer[idx]
	})

}

// Render Aside
function renderAside () {
	asideContent.innerHTML = ''
	const data = Object.entries(storage).filter(([key, value]) => key.includes(searchString) || value.date.includes(searchString))
	for(let item of data) {
		asideContent.insertAdjacentHTML('beforeEnd', createCardElement(item[1].date, item[0], item[1].time))
	}
}

// help fucntions
function startTimer (ms = 1000) {
	return  setInterval(() => updateTimer(ms), ms)
}

function getTimerValue() {
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
	return `
		<div class="ui steps d-flex">
		  <div class="step">
		  	<i class="close icon icon--absolute"></i>
		    <i class="stopwatch icon"></i>
		    <div class="content">
					<div class="date">${date}</div>
		      <div class="title">${value}</div>
		      <div class="description">${title}</div>
		    </div>
		  </div>
		</div>`
}

function getStorage () {
	return new Promise((res, err) => {
		const storage = JSON.parse(localStorage.getItem('timer')) || {}
		res(storage)	
	})
}

// eventListeners
startButton.addEventListener('click', function () {
	this.classList.add(disabled)
	stopButton.classList.remove(disabled)
	timerId = startTimer()
})

stopButton.addEventListener('click', stopTimer)

resetButton.addEventListener('click', function () {
	stopTimer()
	clearTimer()
})

clearStorageButton.addEventListener('click', function () {
	localStorage.clear('timer')
	init()
})

input.addEventListener('input', function () {
	if (this.value !== '') {
		submitButton.classList.remove(disabled)
	} else {
		submitButton.classList.add(disabled)
	}
})

form.addEventListener('submit', function (e) {
	e.preventDefault()
	storage[input.value] = {
		time: getTimerValue(),
		date: new Date().toLocaleString("ru")
	}
	localStorage.setItem('timer', JSON.stringify(storage))
	init()
})

aside.addEventListener('click', function (e) {
	if (e.target.classList.contains('icon--absolute')) {
		const key = e.target.parentNode.querySelector('.description').textContent
		delete storage[key]
		localStorage.setItem('timer', JSON.stringify(storage))
		init()
	}

})

// фильтр
searchInput.addEventListener('input', function () {
	searchString = this.value
	renderAside()
})

document.addEventListener('DOMContentLoaded', function() {
  init()
}, false);

