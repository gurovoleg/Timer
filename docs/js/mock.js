// create mock data
function generateMockData (value = 100) {
	const data = {}
	const key = 'Test task'
	const date = Date.now()

	for (let i = 1; i <= value; i++) {
		data[`${key} ${i}`] = {
			time: '00:00:10',
			date: new Date(date + i * 1000).toLocaleString('ru')
		}
	}
	return data
}

// set mock data
function setMockData (data) {
	localStorage.setItem(storageKey, JSON.stringify(data))
}