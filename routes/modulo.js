var express = require('express');
var router = express.Router();
var Modulo = require('../models/moduloModel').Modulo;
var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');


/* GET modulo page. */

router.get('/', function(req, res, next) {
	var fecha = new Date();
	logger.debug(fecha);
	
	if( typeof req.session.modulo === 'undefined' || typeof req.session.tramite === 'undefined' ){
	
		res.redirect('/');	
		
	}else{	

		var fecha = new Date();
		var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
		
		Modulo.findOne({'modulo': req.session.modulo, 'tramite': req.session.tramite, '$where': 'this.fecha.toJSON().slice(0, 10) == "' + fechaActual + '"'}, function(err, modulo){
			
			if( typeof modulo === 'undefined' || modulo === null ){
				
				var modulo = new Modulo({
					modulo: req.session.modulo,
					tramite: req.session.tramite,
					indicePerAtendidas: 0,			
					perAtendidas: [],
					contador: 0,
					fecha: fecha,
					estado: true
				});
				var perAtendidas =  {indiceAten: 0, fechaInicio: new Date(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};

				modulo.perAtendidas.push(perAtendidas);
				
				modulo.save(function (err) {
					if (err) {
						logger.debug(err);
					} else {
						logger.debug("Nuevo[GET]: " + modulo.toString());
						res.render('modulo.html', {'fechaAct': fecha});
					}
				});

			}else{
				modulo.estado = true;

				modulo.save(function (err) {
					if (err) {
						logger.debug(err);
					} else {
						logger.debug("Ya existe[GET]: " + modulo.toString());
						res.render('modulo.html', {'fechaAct': fecha});
					}
				});
				
			}		
		});
	}		
	
});

/* POST modulo page. */

router.post('/', function(req, res, next) {
	
	req.session.modulo = req.body.modulo;
	req.session.tramite = req.body.tramite;
	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + ", " + (fecha.getMonth()+1) + ", " + fecha.getDate();
	
	//Buscamos en la base de datos si no se ha creado un objeto similar antes.
	Modulo.findOne({'modulo': req.session.modulo, 'tramite': req.session.tramite, 'fecha': {"$gte": new Date(fechaActual), "$lt": new Date(fechaActual)}}, function(err, modulo){
		
		if( typeof modulo === 'undefined' || modulo === null ){
			
			var modulo = new Modulo({
				modulo: req.session.modulo,
					tramite: req.session.tramite,
					indicePerAtendidas: 0,			
					perAtendidas: [],
					contador: 0,
					fecha: fecha,
					estado: true
			});
			var perAtendidas =  {indiceAten: 0, fechaInicio: new Date(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};

			modulo.perAtendidas.push(perAtendidas);
			
			modulo.save(function (err) {
				if (err) {
					logger.debug(err);
				} else {
					logger.debug("Nuevo[POST]: " + modulo.toString());
					res.render('modulo.html', {'fechaAct': fecha});
				}
			});

		}else{
			modulo.estado = true;

			modulo.save(function (err) {
				if (err) {
					logger.debug(err);
				} else {
					logger.debug("Ya existe[POST]: " + modulo.toString());
					res.render('modulo.html', {'fechaAct': fecha});
				}
			});
			
		}		
	});
	
});

module.exports = router;