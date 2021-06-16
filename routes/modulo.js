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

	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var fechaFormat = days[fecha.getDay()] + " " + months[fecha.getMonth()] + " " + fecha.getDate() + " " + fecha.getFullYear();
	
	//Verificamos si existen las sesiones para oficina y servicio
	//Si no existe alguna de ellas redirigimos al formulario para iniciar sesión
	if( typeof req.session.oficina === 'undefined' || typeof req.session.servicio === 'undefined' ){
	
		res.redirect('/');
	
	//Si existen las variables de sesión creamos el registro
	}else{	

		var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
		
		Modulo.findOne({'oficina': req.session.oficina, 'servicio': req.session.servicio, 'fecha': fechaActual}, function(err, modulo){
			
			//Si el módulo aún no existe creamos uno nuevo
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
						res.render('modulo.html', {'fechaAct': fechaFormat});
					}
				});

			//Si ya existe cambiamos sus datos
			}else{				

				modulo.estado = true;

				var perAtendidas =  {indiceAten: 0, fechaInicio: new Date(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};

				modulo.perAtendidas.push(perAtendidas);

				modulo.save(function (err) {
					if (err) {
						logger.debug(err);
					} else {
						logger.debug("Ya existe[GET]: " + modulo.toString());
						res.render('modulo.html', {'fechaAct': fechaFormat});
					}
				});
				
			}		
		});
	}		
	
});

/* POST modulo page. */

router.post('/', function(req, res, next) {
	
	req.session.oficina = req.body.oficina;
	req.session.servicio = req.body.servicio;

	var fecha = new Date();

	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var fechaFormat = days[fecha.getDay()] + " " + months[fecha.getMonth()] + " " + fecha.getDate() + " " + fecha.getFullYear();

	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();
	
	Modulo.findOne({'oficina': req.session.oficina, 'servicio': req.session.servicio, 'fecha': fechaActual}, function(err, modulo){
		
		console.log("Metodo post para leer una sesion");	

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
					console.log("1-" + err);
				} else {
					logger.debug("Nuevo[POST]: " + modulo.toString());
					console.log("Nuevo[POST]: " + modulo.toString());
					res.render('modulo.html', {'fechaAct': fechaFormat});
				}
			});

		}else{

			modulo.estado = true;

			var perAtendidas =  {indiceAten: 0, fechaInicio: new Date(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};

			modulo.perAtendidas.push(perAtendidas);

			modulo.save(function (err) {
				if (err) {
					logger.debug(err);
					console.log("2-" + err);
				} else {
					logger.debug("Ya existe[POST]: " + modulo.toString());
					console.log("Nuevo[POST]: " + modulo.toString());
					res.render('modulo.html', {'fechaAct': fechaFormat});						
				}
			});
					
		
		}		
	});
	
});

module.exports = router;