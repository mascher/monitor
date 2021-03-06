require('console-stamp')(console, {
	colors: {
		stamp: 'yellow',
		label: 'cyan',
		label: true,
		metadata: 'green'
	}
});

/*Kurt test*/
var options = {
  useMongoClient: true};

/* Moduless */
const mongoose = require('mongoose');
const express = require('express');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const http = require('http');
const moment = require('moment');

/* Classes and Models */
const Task = require('./src/classes/Task.js');
const AppRouter = require('./src/classes/AppRouter.js');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');

/* Express Server Setup */
const app = express();
app.server = http.createServer(app);

console.log(`The server was created`);

global.status = 'Stopped';
global.tasks = [];
global.logs = '';
global.config = require('./config')

const PORT = global.config.port;

/* MongoDB Connection */
console.log(`Starting the mongo connection`);
mongoose.set('debug', false);
mongoose.Promise = Promise;
/* remove for testing mongoose.connect(global.config.mongodb_uri, (err) => { */
mongoose.connect("mongodb://admin:Cheese123@ds239931.mlab.com:39931/luke-mongo", options, (err) => {
	if (!err) {

		Product.remove({}, function(err) {
			if (!err) {
				console.log('All items in the Product collection have been removed.')
			}
		});

		nunjucks.configure('views', {
			autoescape: true,
			watch: true,
			express: app
		});

		app.use('/resources', express.static(__dirname + '/resources'));

		app.use(bodyParser.json({
			limit: '50mb'
		}));
		app.use(bodyParser.urlencoded({
			extended: true,
			limit: '50mb'
		}));

		app.set('view engine', 'html');

		new AppRouter(app);

		app.server.listen(process.env.PORT || PORT, () => {
			console.log(`App is running on at http://127.0.0.1:${app.server.address().port}`);
		});
		return;
	}
	console.error('MongoDB connection error. Please make sure MongoDB is running.\n', err);
	process.exit();
});

global.startTasks = function() {

	Product.remove({}, function(err) {
		if (!err) {
			Seller.find({}, (err, tasksQuery) => {
				for (let i = 0; i < tasksQuery.length; i++) {
					global.tasks.push(new Task(tasksQuery[i]));
					global.tasks[i].start();
				}
				global.status = 'Active';
				global.startTime = moment().format('x');
				global.needsRestart = false;
				global.stoppedTime = null
			});
		}
	});
}

global.stopTasks = function() {
	Seller.find({}, (err, tasksQuery) => {
		for (let i = 0; i < global.tasks.length; i++) {
			global.tasks[i].stop();
		}
		global.tasks = [];
		global.status = 'Stopped';
		global.needsRestart = false;
		global.stoppedTime = moment().format('x')
	});
}
