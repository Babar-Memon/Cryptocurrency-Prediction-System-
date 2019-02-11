/*
  ------------ TODOS -----------
  - Human factor
*/
const { forEach } = require('p-iteration');
const fs = require('fs');

var fetch = require('node-fetch');

var bitcoinData = {
	results: ''
};
const K = 10;
const QUERY_RANGE = 365; // How much days to go back in history to search for results (QUERY_RANGE + requestedDays)
const COIN_FETCH_TIMEOUT = 1000 * 60 * 118; // Fetch latest bitcoin prices 2 minutes before the bot awakens

var tickerApiUrl = 'https://blockchain.info/ticker';
var chartsApiUrl = 'https://api.coindesk.com/v1/bpi/historical/close.json';
var tickerEth = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD';
var chartsApiEth = 'https://poloniex.com/public?command=returnChartData&currencyPair=USDT_ETH';

var todayDate = new Date();
todayDate = todayDate.toISOString().split('T')[0];
refreshBitcoinPrices(tickerApiUrl);
refreshEthPrices(tickerEth);

function run(query, callback) {
	fetchBlacklist()
		.then(() => {
			var requestedDay = query;
			this.lastRequestedDaySpan = requestedDay;
			return queryChartHistory(chartsApiUrl, requestedDay);
		})
		// When the kNearest Neighbours algorithm is finished, get the start and end bitcoin value for the timespan in history, and calculate ratio between every one of them
		.then(finalResults => {
			return calculatePrediction(finalResults, bitcoinData.results.USD.last);
		})
		// When the prediction is calculated
		.then(prediction => {
			this.prediction = prediction;
			// console.log(prediction);
			// console.log('Time of prediction: ' + new Date().getHours() + ':' + new Date().getMinutes());
			console.log(
				'Prediction for the next ' + this.lastRequestedDaySpan + ' days is: ' + this.prediction.finalValue
			);
			// if (this.prediction.positive == 'true') {
			// 	console.log('Gain: ' + this.prediction.raw);
			// 	console.log('Gain prctg: ' + this.prediction.percentage);
			// } else {
			// 	console.log('Loss: ' + this.prediction.raw);
			// 	console.log('Loss prctg: ' + this.prediction.percentage);
			// }
			return callback(this.prediction);
		});
}

function runETH(query, callback) {
	queryEthHistory(query)
		.then(async finalResults => {
			var results = await fetch(
				'https://apiv2.bitcoinaverage.com/indices/global/history/ETHUSD?period=alltime&?format=json'
			);
			results = await results.json();
			console.log(results);
			return calculatePredictionETH(finalResults, results[0].open);
		})
		.then(prediction => {
			this.lastRequestedDaySpan = query;
			this.prediction = prediction;
			console.log(
				'Prediction for the next ' + this.lastRequestedDaySpan + ' days is: ' + this.prediction.finalValue
			);
			if (callback) return callback(this.prediction);
			else return this.prediction;
		});
}
function runLTC(query, callback) {
	queryLtcHistory(query)
		.then(async finalResults => {
			var results = await fetch(
				'https://apiv2.bitcoinaverage.com/indices/global/history/LTCUSD?period=alltime&?format=json'
			);
			results = await results.json();
			console.log(results);
			return calculatePredictionETH(finalResults, results[0].open);
		})
		.then(prediction => {
			this.lastRequestedDaySpan = query;
			this.prediction = prediction;
			console.log(
				'Prediction for the next ' + this.lastRequestedDaySpan + ' days is: ' + this.prediction.finalValue
			);
			if (callback) return callback(this.prediction);
			else return this.prediction;
		});
}
function refreshEthPrices(tickerEth) {
	const request = async tickerEth => {
		var results = await fetch(tickerEth);
		results = await results.json();
		console.log(results);
		results ? console.log('Ethereum API Works!') : console.log('Ethereum API is down at the moment');
	};
	request(tickerEth);

	setInterval(() => {
		request(tickerEth);
	}, COIN_FETCH_TIMEOUT);
}

/**
 * Refreshes bitcoin prices minute before the main thread starts the work
 * @param {*String} tickerApiUrl API endpoint for getting the latest bitcoin prices 
 */
function refreshBitcoinPrices(tickerApiUrl) {
	const request = async tickerApiUrl => {
		var results = await fetch(tickerApiUrl);
		results = await results.json();
		bitcoinData.results = results;
		if (bitcoinData.results) {
			console.log('Blockchain API works!');
		} else console.log('Blockchain API is down at the moment.');

		// Get todays date
		this.todayDate = new Date();
		this.todayDate = this.todayDate.toISOString().split('T')[0];
		// console.log(this.todayDate);

		// console.log('New prices fetched.');
		// console.log('Most recent bitcoin price: ' + bitcoinData.results.USD.last);
		// console.log('Time: ' + new Date().getHours() + ':' + new Date().getMinutes());
	};

	request(tickerApiUrl);

	// Enable in prod
	setInterval(() => {
		request(tickerApiUrl);
	}, COIN_FETCH_TIMEOUT);
}

async function queryEthHistory(nDays, callback) {
	var results = await fetch(
		'https://apiv2.bitcoinaverage.com/indices/global/history/ETHUSD?period=alltime&?format=json'
	);
	results = await results.json();
	const similarities = await calculateSimilarityLTC(results, results[0]);
	const kNearest = await getNearestNeighbours(similarities);
	const finalResults = await getFinalResultsLTC(kNearest, nDays, results);
	if (callback) {
		return callback(finalResults);
	} else {
		return finalResults;
	}
}
async function queryLtcHistory(nDays, callback) {
	var results = await fetch(
		'https://apiv2.bitcoinaverage.com/indices/global/history/LTCUSD?period=alltime&?format=json'
	);
	results = await results.json();
	var nDaysBack = new Date();
	nDaysBack.setDate(nDaysBack.getDate() - (nDays + 1));
	results = results.filter(a => new Date(a.time).getTime() > nDaysBack.getTime());
	const similarities = await calculateSimilarityLTC(results, results[0]);
	const kNearest = await getNearestNeighbours(similarities);
	const finalResults = await getFinalResultsLTC(kNearest, nDays, results);
	if (callback) {
		return callback(finalResults);
	} else {
		return finalResults;
	}
}

/**
 * Queries the CoinDesk api for specific date span
 * Returns array of bitcoin values based on k nearest neighbours, start - value on the start day, end - value after n days
 * @param {*String} chartsApiUrl API endpoint for getting bitcoin history values
 * @param {*String} nDays how many days to go backwards
 */
async function queryChartHistory(chartsApiUrl, nDays, callback) {
	var nDaysBack = new Date();
	nDaysBack.setDate(nDaysBack.getDate() - (nDays + 1));
	nDaysBack = nDaysBack.toISOString().split('T')[0];

	var nMonthsBack = new Date();
	nMonthsBack.setDate(nMonthsBack.getDate() - (nDays + 1) - QUERY_RANGE);
	nMonthsBack = nMonthsBack.toISOString().split('T')[0];

	var today = new Date();
	today.setDate(today.getDate() - 1);
	today = today.toISOString().split('T')[0];

	const results = await fetch(chartsApiUrl + '?start=' + nMonthsBack + '&end=' + nDaysBack);
	const resultsJson = await results.json();

	const fullResults = await fetch(chartsApiUrl + '?start=' + nMonthsBack + '&end=' + today);
	this.coinDeskApiResults = await fullResults.json();

	//console.log(resultsJson);

	const similarities = await calculateSimilarity(resultsJson, bitcoinData.results.USD.last);
	const kNearest = await getNearestNeighbours(similarities);
	const finalResults = await getFinalResults(kNearest, nDays);
	// console.log(kNearest);
	// console.log(finalResults);
	if (callback) {
		return callback(finalResults);
	} else {
		return finalResults;
	}
}

async function calculateSimilarityLTC(data, currentLtcValue) {
	var similarities = [];

	currentLtcValue = currentLtcValue.open;
	data.forEach(a => {
		var simalrity = {
			date: a.time,
			similarityScore: currentLtcValue - a.open
		};
		similarities.push(simalrity);
	});
	return similarities;
}

/**
 * Calculates the similarity score (distance between current Ether value and all of the other Ether values in the past)
 * Returns JSON object with similarity scores ID: date, value: the similarity between current btc value and the value on that day (the lower the number, they are more similar)
 * @param {*Object} data Data from QUERY_RANGE days back
 * @param {*Int} currentBTCValue Current bitcoin value
 */
async function calculateSimilarityEth(data, currentEthValue) {
	// Go through all and calculate currentBtc - data[key]
	var similarities = [];
	/*
    Similarity object looks something like this:
    {
      date: '2017-10-08',
      similarityScore: 1140 (difference between current Ether and Ether on that day)
    }
  */
	currentEthValue = currentEthValue.open;
	data.forEach(a => {
		var similarity = {
			date: a.time,
			similarityScore: currentEthValue - a.open
		};
		similarities.push(similarity);
	});
	return similarities;
}

/**
 * Calculates the similarity score (distance between current bitcoin value and all of the other bitcoin values in the past)
 * Returns JSON object with similarity scores ID: date, value: the similarity between current btc value and the value on that day (the lower the number, they are more similar)
 * @param {*Object} data Data from QUERY_RANGE days back
 * @param {*Int} currentBTCValue Current bitcoin value
 */
async function calculateSimilarity(data, currentBTCValue) {
	// Go through all and calculate currentBtc - data[key]
	var similarities = [];
	/*
    Similarity object looks something like this:
    {
      date: '2017-10-08',
      similarityScore: 1140 (difference between current BTC and btc on that day)
    }
  */
	Object.keys(data.bpi).forEach((key, index) => {
		var similarity = {
			date: key,
			similarityScore: currentBTCValue - data.bpi[key]
		};
		similarities.push(similarity);
	});
	return similarities;
}

/**
 * Returns k nearest neighbours (dates) based on similarityScores
 * @param {*Array} similarities data with all of the similarity scores compared to current bitcoin value, all the way up to QUERY_RANGE days back
 */
async function getNearestNeighbours(similarities) {
	// Run through, and find k(10) that are closest to 0
	var absSimilarities = [];
	similarities.forEach(similarity => {
		absSimilarities.push({
			date: similarity.date,
			similarityScore: Math.abs(similarity.similarityScore)
		});
	});
	absSimilarities = absSimilarities.sort(function(a, b) {
		return a.similarityScore > b.similarityScore ? 1 : b.similarityScore > a.similarityScore ? -1 : 0;
	});
	var kNearest = [];
	// console.log(absSimilarities);
	for (var i = 0; i < K; i++) {
		if (absSimilarities[i]) {
			kNearest.push(absSimilarities[i].date);
		} else {
			break;
		}
	}
	return kNearest;
}

async function getFinalResultsLTC(kNearest, nDays, data) {
	var finalResults = [];
	var finalResult = {};

	await forEach(kNearest, async date => {
		var dateTime = new Date(date);
		var futureDate = new Date(date);
		futureDate.setDate(futureDate.getDate() + nDays);

		var valueForThatDay = data.filter(a => {
			return new Date(a.time).getTime() == dateTime.getTime();
		})[0].open;
		var valueForFutureDay = data.filter(a => new Date(a.time).getTime() == futureDate.getTime());
		if (valueForFutureDay.length) {
			valueForFutureDay = valueForFutureDay[0].open;
		} else {
			valueForFutureDay = valueForThatDay;
		}
		finalResult = {
			start: valueForThatDay,
			end: valueForFutureDay
		};

		finalResults.push(finalResult);
	});
	return finalResults;
}

/**
 * Returns array of objects containing start and end values
 * start - value of bitcoin on the start day
 * end - value of bitcoin after n days
 * @param {*Array} kNearest Array of dates for which the bitcoin value was the most similar to current btc value
 * @param {*Int} nDays Days to go in the future, and get the value of btc on that date, to compare
 */
async function getFinalResults(kNearest, nDays) {
	var finalResults = [];
	var finalResult = {};

	await forEach(kNearest, async date => {
		var dateTime = new Date(date);
		var pastDate = dateTime.toISOString().split('T')[0];

		var futureDate = new Date(date);
		futureDate.setDate(futureDate.getDate() + nDays);
		futureDate = futureDate.toISOString().split('T')[0];
		var valueForThatDay = this.coinDeskApiResults.bpi[pastDate];
		var valueForFutureDay = this.coinDeskApiResults.bpi[futureDate];

		finalResult = {
			start: valueForThatDay,
			end: valueForFutureDay
		};

		finalResults.push(finalResult);
	});
	return finalResults;
}

/**
 * Returns array of objects containing start and end values
 * start - value of bitcoin on the start day
 * end - value of bitcoin after n days
 * @param {*Array} kNearest Array of dates for which the bitcoin value was the most similar to current btc value
 * @param {*Int} nDays Days to go in the future, and get the value of btc on that date, to compare
 */
async function getFinalResultsEth(kNearest, nDays, EthValues) {
	var finalResults = [];
	var finalResult = {};

	await forEach(kNearest, async date => {
		var dateTime = new Date(date);
		var futureDate = new Date(date);
		futureDate.setDate(futureDate.getDate() + nDays);

		var valueForThatDay = EthValues.filter(a => {
			return new Date(a.time).getTime() == dateTime.getTime();
		})[0].open;
		var valueForFutureDay = EthValues.filter(a => new Date(a.time).getTime() == futureDate.getTime());
		if (valueForFutureDay.length) {
			valueForFutureDay = valueForFutureDay[0].close;
		} else {
			valueForFutureDay = valueForThatDay;
		}
		finalResult = {
			start: valueForThatDay,
			end: valueForFutureDay
		};

		finalResults.push(finalResult);
	});
	return finalResults;
}

/**
 * Calculates the prediction
 * Returns object containing valuable data for prediction
 * @param {*Array} data Array of objects, containing start and end bitcoin values
 * @param {*Float} currentBitcoinValue Current btc value
 */
async function calculatePrediction(data, currentBitcoinValue) {
	var finalPredictionData = {
		raw: 0,
		percentage: 0,
		positive: '',
		finalValue: 0
	};
	var sum = 0;
	await forEach(data, async value => {
		sum += value.end - value.start;
	});

	sum = sum / K;
	finalPredictionData.raw = sum;
	finalPredictionData.finalValue = currentBitcoinValue + sum;
	finalPredictionData.positive = sum > 0 ? 'true' : 'false';
	finalPredictionData.percentage = (finalPredictionData.finalValue - currentBitcoinValue) / currentBitcoinValue * 100;
	return finalPredictionData;
}

/**
 * Calculates the prediction ETH
 * Returns object containing valuable data for prediction
 */
async function calculatePredictionETH(data, currentEthValue) {
	// console.log(arguments);
	var finalPredictionData = {
		raw: 0,
		percentage: 0,
		positive: '',
		finalValue: 0
	};
	var sum = 0;
	await forEach(data, async value => {
		sum += value.end - value.start;
	});

	sum = sum / K;
	finalPredictionData.raw = sum;
	finalPredictionData.finalValue = currentEthValue + sum;
	finalPredictionData.positive = sum > 0 ? 'true' : 'false';
	finalPredictionData.percentage = (finalPredictionData.finalValue - currentEthValue) / currentEthValue * 100;
	return finalPredictionData;
}

/**
 * Fetches the blacklist from blacklist.txt
 * @returns array of numbers in blacklist
 */
async function fetchBlacklist() {
	var blackListString = fs.readFileSync('blacklist.txt').toString();
	var fetched = blackListString.split(',').map(Number);
	return fetched;
}

module.exports = {
	run: run,
	chartHistory: queryChartHistory,
	runEth: runETH,
	runLtc: runLTC
};
