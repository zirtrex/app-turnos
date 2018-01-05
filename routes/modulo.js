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
	
	if( typeof req.session.oficina === 'undefined' || typeof req.session.servicio === 'undefined' ){
	
		res.redirect('/');	
		
	}else{	

		var fecha = new Date();
		var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
		
		Modulo.findOne({'oficina': req.session.oficina, 'servicio': req.session.servicio, 'fecha': fechaActual}, function(err, modulo){
			
			if( typeof modulo === 'undefined' || modulo === null ){
				
				var modulo = new Modulo({
											oficina: req.session.oficina,
											servicio: req.session.servicio,
											indicePerAtendidas: 0,			
											perAtendidas: [],
											contador: 0,
											fecha: fechaActual,
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

				if(modulo.estado == false){

					modulo.estado = true;

					var perAtendidas =  {indiceAten: 0, fechaInicio: new Date(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};

					modulo.perAtendidas.push(perAtendidas);

					modulo.save(function (err) {
						if (err) {
							logger.debug(err);
						} else {
							logger.debug("Ya existe[GET]: " + modulo.toString());
							
						}
					});

				}

				res.render('modulo.html', {'fechaAct': fecha});
				
			}		
		});
	}		
	
});

/* POST modulo page. */

router.post('/', function(req, res, next) {
	
	req.session.oficina = req.body.oficina;
	req.session.servicio = req.body.servicio;

	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
	
	Modulo.findOne({'oficina': req.session.oficina, 'servicio': req.session.servicio, 'fecha': fechaActual}, function(err, modulo){
		
		if( typeof modulo === 'undefined' || modulo === null ){
			
			var modulo = new Modulo({
										oficina: req.session.oficina,
										servicio: req.session.servicio,
										indicePerAtendidas: 0,			
										perAtendidas: [],
										contador: 0,
										fecha: fechaActual,
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

			if(modulo.estado == false){

				modulo.estado = true;

				var perAtendidas =  {indiceAten: 0, fechaInicio: new Date(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};

				modulo.perAtendidas.push(perAtendidas);

				modulo.save(function (err) {
					if (err) {
						logger.debug(err);
					} else {
						logger.debug("Ya existe[POST]: " + modulo.toString());
						
					}
				});

			}

			res.render('modulo.html', {'fechaAct': fecha});
		
		}		
	});
	
});

module.exports = router;