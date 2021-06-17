var express = require('express');
var router = express.Router();
var database = require('../models/moduloModel').database;
var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('show');
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

router.get('/modulo', async function(req, res, next) {
	const modulosRef = database.collection('modulos');
	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
	const queryRef = await modulosRef.where('oficina', '==', req.session.oficina || '')
																	.where('servicio', '==', req.session.servicio || '')
																	.where('fecha', '==', fechaActual).get();        
	if (!queryRef.empty) {
		var modulo;
		queryRef.forEach(doc => {
			modulo = doc.data();
		});
		res.send(modulo);
	}	
});

router.get('/modulos', async function(req, res, next) {
	const modulosRef = database.collection('modulos');
	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();

	const queryRef = await modulosRef.where('estado', '==', true)
																	.where('fecha', '==', fechaActual)
																	.get();
	var modulos = [];
	if (!queryRef.empty) {		
		queryRef.forEach(doc => {
				modulos.push(doc.data());
		});	
	}
	console.log(modulos);
	res.send(modulos);	
});

module.exports = router;
