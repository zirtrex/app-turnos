var express = require('express');
var router = express.Router();
var Modulo = require('../models/moduloModel').Modulo;
var path    = require("path");
var log4js = require('log4js');

log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');


/* GET home page. */

router.get('/', function(req, res, next) {

	res.render('reports.ejs');

	req.app.io.on('connection', function(socket) {

		socket.on("Creando_Vista", function (viewData) {
			logger.debug("Se ha creado una vista:" + viewData.channel);			
			req.session.viewChannel = viewData.channel;			
		});

	});
	
});

router.get('/b', function(req, res, next) {

	res.render('show_2');

	req.app.io.on('connection', function(socket) {

		socket.on("Creando_Vista", function (viewData) {
			logger.debug("Se ha creado una vista b:" + viewData.channel);			
			req.session.viewChannel = viewData.channel;			
		});

	});
	
});

router.get('/youtube', function(req, res, next) {

	var index = req.query.index || 1;
	var v = req.query.v || 'sWhISWSJghw'; 
	var list = req.query.list || 'PLEQ2sMVkjQ2mxhnKWpl6XqGxno80F837r';

	res.render('show_youtube.ejs', {
        "index": index,
        "v": v,
        "list": list
    });
	
});

router.get('/facebook', function(req, res, next) {

	var v = req.query.v || 'https://web.facebook.com/cecunuevayork/videos/849561488502059/';

	res.render('show_facebook.ejs', {
        "v": v,
    });
	
});

router.get('/modulo', function(req, res, next) {

	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
	
	Modulo.findOne({'oficina': req.session.oficina, 'servicio': req.session.servicio, 'estado': true, 'fecha': fechaActual}, function(err, modulo){

	    if(err){
			logger.debug(err);
		}
		res.send(modulo);
	}); 
	
});

router.get('/modulos', function(req, res, next) {

	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
	
	Modulo.find({'estado': true, 'fecha': fechaActual}).limit(5).sort({'contador': 'descending'}).exec(function(err, modulos){
		if(err){
			logger.debug(err);
		}
		res.send(modulos);
	});
	
});

module.exports = router;
