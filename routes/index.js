var express = require('express');
var router = express.Router();
var Modulo = require('../models/moduloModel').Modulo;
var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');

/* GET home page. */

router.get('/', function(req, res, next) {

	res.render('index.jade', {'titulo' : "Sistema de Turnos", 'fecha': fechaFormat});

	var fecha = new Date();
	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var fechaFormat = days[fecha.getDay()] + " " + months[fecha.getMonth()] + " " + fecha.getDate() + " " + fecha.getFullYear();

	/*logger.debug("Fecha: " + fecha);

	if(typeof req.session.oficina === 'undefined' && typeof req.session.servicio === 'undefined')
	{
		res.render('index.jade', {'titulo' : "Sistema de Turnos", 'fecha': fechaFormat});
	}
	else if(typeof req.session.servicio === 'undefined')
	{
		res.render('index.jade', {'titulo' : "Sistema de Turnos", 'oficina': req.session.oficina, 'fecha': fechaFormat} );
	}
	else
	{
		res.redirect('/modulo');
	}*/
	
});

router.get('/cambiar', function(req, res, next) {

	if(typeof req.session.oficina === 'undefined' && typeof req.session.servicio === 'undefined'){
		res.redirect('/');
	}else{
		logger.debug("Cambiando trámite");
		delete req.session.oficina;
		delete req.session.servicio;					
		res.redirect('/');
	}

});

router.get('/video', function(req, res, next) {

		res.render('video.html', {} );
	
});

module.exports = router;