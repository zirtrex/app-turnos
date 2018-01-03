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
	var fecha = new Date();
	logger.debug(fecha);
	if(typeof req.session.modulo === 'undefined' && typeof req.session.tramite === 'undefined'){
		res.render('index.jade', {'titulo' : "Sistema de Turnos", 'fecha': fecha});
	}else if(typeof req.session.tramite === 'undefined'){
		res.render('index.jade', {'titulo' : "Sistema de Turnos", 'modulo': req.session.modulo, 'fecha': fecha} );
	}else{
		res.redirect('/modulo');
	}
	
});

router.get('/cambiar', function(req, res, next) {
	logger.debug("Cambiando tipo de trámite");

	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();

	if(typeof req.session.modulo === 'undefined' && typeof req.session.tramite === 'undefined'){
		res.redirect('/');
	}else{
		Modulo.findOne({'modulo': req.session.modulo, 'tramite': req.session.tramite, 'fecha': {"$gte": new Date(fechaActual), "$lt": new Date(fechaActual)}}, function(err, modulo){

			modulo.estado = true;

			modulo.save(function (err) {
				if (err) {
					logger.debug(err);
				} else {
					logger.debug("Cambiando trámite: " + modulo.toString());

					delete req.session.tramite;
					
					res.redirect('/');
				}
			});
		});
	}

});

router.get('/video', function(req, res, next) {

		res.render('video.html', {} );
	
});

module.exports = router;