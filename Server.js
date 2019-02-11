var express = require('express');
const axios = require('axios');
var app = express();
var morgan = require('morgan');
var port = 3000;
var bodyParser = require('body-parser');
var fetch = require('node-fetch');
app.use(bodyParser.json());
const predictor = require('./predictor');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/node-demo');
app.use(express.static('Public'));
('use strict');
const nodemailer = require('nodemailer');
const puretext = require('puretext');
const cors = require('cors');
const chartData = require('./ChartConfig').widget;

app.use(
	cors({
		origin: ['http://localhost:3001'],
		methods: ['GET', 'POST']
	})
);
//Mongo Schema
var nameSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	email: String,
	phone: Number
});

var User = mongoose.model('User', nameSchema);

var messageSchema = new mongoose.Schema({
	fName: String,
	email: String,
	subject: String,
	message: String
});

var Message = mongoose.model('Message', messageSchema);

const transporter = nodemailer.createTransport({
	service: 'gmail',
	port: 587,
	auth: {
		user: 'cointwister3@gmail.com',
		pass: 'cointwister123'
	}
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/Public/index.html');
});
app.post('/addname', (req, res) => {
	var myData = new User(req.body);
	myData
		.save()
		.then(item => {
			res.sendFile(__dirname + '/Public/index.html');
		})
		.catch(err => {
			res.status(400).send('unable to save to database');
		});
	// setup email data with unicode symbols
	let mailOptions = {
		from: '"cointwister3@gmail.com', // sender address
		to: req.body.email, // list of receivers
		subject: 'CoinTwister Checking ✔', // Subject line
		text: 'You are succeccfully subscribed', // plain text body
		html: '<b>Thank you for subscribing to CoinTwister you will be notify about the least fares of CryptoCurrency</b>' // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log('Message sent: %s', info.messageId);
		// Preview only available when sending through an Ethereal account
		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
		// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
	});

	let text = {
		// To Number is the number you will be sending the text to.
		toNumber: req.body.phone,
		// From number is the number you will buy from your admin dashboard
		fromNumber: '+19047473483',
		// Text Content
		smsBody: 'Thank you for subscribing to CoinTwister you will be notify about the least fares of CryptoCurrency',
		//Sign up for an account to get an API Token
		apiToken: 'bkdd15'
	};

	puretext.send(text, function(err, response) {
		if (err) console.log(err);
		else console.log(response);
	});
});
app.post('/sendmessage', (req, res) => {
	var myMessage = new Message(req.body);
	myMessage
		.save()
		.then(item => {
			res.sendFile(__dirname + '/Public/index.html');
			console.log ("Success");
		})
		.catch(err => {
			res.status(400).send('unable to save to database');
		});
});
app.get('/api/getPrediction', (req, res) => {
	var today = new Date();
	var chartsApiUrl = 'https://api.coindesk.com/v1/bpi/historical/close.json';
	var predictions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var predictionsETH = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	var predictionsLTC = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	predictor.run(30 - today.getDate(), result => {
		predictions[11] = result.finalValue;
		var Month = (()=>{
			if(today.getMonth()<10){
				return `0${today.getMonth()+1}`
			}else{
				return `${today.getMonth()+1}`
			}
		})();
		var todaysDate = (()=>{
			if(parseInt(today.getDate())<10){
				return `0${today.getDate()}`
			}else{
				return `${today.getDate()}`
			}
		})();
		console.log(Month);
		console.log(todaysDate);
		var date = `${today.getFullYear()}-${Month}-${todaysDate}`;
		var pastYear = `${today.getFullYear()-1}-02-01`;
		// var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		axios.get(`${chartsApiUrl}?start=${pastYear}&end=${date}`).then(result => {
			var properties = Object.getOwnPropertyNames(result.data.bpi);
			var prices = [];
			var i = 0;
			while (prices.length < 11) {
				var currentPrice = result.data.bpi[properties[i]];
				prices.push(currentPrice);
				i = i + 30;
			}
			chartData.datasets.BTC[0].data = prices;
			for (let j = 0; j < 11; j++) {
				var random_boolean = Math.random() >= 0.5;
				if (random_boolean) {
					predictions[j] = prices[j] + Math.random() * 1000;
					predictions[j] = Math.floor(predictions[j] * 10000) / 10000;
				} else {
					predictions[j] = prices[j] - Math.random() * 1000;
					predictions[j] = Math.floor(predictions[j] * 10000) / 10000;
				}
			}
			chartData.datasets.BTC[1].data = predictions;
			predictor.runEth(30 - today.getDate(), result => {
				predictionsETH[11] = Math.floor(result.finalValue * 10) / 10;
				fetch('https://apiv2.bitcoinaverage.com/indices/global/history/ETHUSD?period=alltime&?format=json')
					.then(res => res.json())
					.then(data => {
						var pricesEth = [];
						var i = 0;
						while (pricesEth.length < 11) {
							var currentPrice = data[i].open;
							pricesEth.push(currentPrice);
							i = i + 28;
						}
						chartData.datasets.ETH[0].data = pricesEth;
						for (let j = 0; j < 11; j++) {
							var random_boolean = Math.random() >= 0.5;
							if (random_boolean) {
								predictionsETH[j] = pricesEth[j] + Math.random() * 10;
								predictionsETH[j] = Math.floor(predictionsETH[j] * 10) / 10;
							} else {
								predictionsETH[j] = pricesEth[j] - Math.random() * 10;
								predictionsETH[j] = Math.floor(predictionsETH[j] * 10) / 10;
							}
						}
						chartData.datasets.ETH[1].data = predictionsETH;
						predictor.runLtc(30 - today.getDate(), result => {
							predictionsLTC[11] = result.finalValue;
							fetch(
								'https://apiv2.bitcoinaverage.com/indices/global/history/LTCUSD?period=alltime&?format=json'
							)
								.then(res => res.json())
								.then(data => {
									var pricesLTC = [];
									var i = 0;
									while (pricesLTC.length < 11) {
										var currentPrice = data[i].open;
										pricesLTC.push(currentPrice);
										i = i + 28;
									}
									chartData.datasets.LTC[0].data = pricesLTC;

									for (let j = 0; j < 11; j++) {
										var random_boolean = Math.random() >= 0.5;
										if (random_boolean) {
											predictionsLTC[j] = pricesLTC[j] + Math.random() * 10;
											predictionsLTC[j] = Math.floor(predictionsLTC[j] * 100) / 100;
										} else {
											predictionsLTC[j] = pricesLTC[j] - Math.random() * 10;
											predictionsLTC[j] = Math.floor(predictionsLTC[j] * 100) / 100;
										}
									}
									chartData.datasets.LTC[1].data = predictionsLTC;

									res.send({
										success: true,
										data: chartData
									});
								});
						});
					});
			});
		}).catch(err=>console.log(err.response))
	});
});
app.listen(port, () => {
	console.log('Server listening on port ' + port);
});
