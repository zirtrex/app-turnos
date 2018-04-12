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


/* GET Reports page. */

router.get('/', function(req, res, next) {

	console.log("Se ha creado la página principal de reporte:");

	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();


	var oficinas = Modulo.find({}).select({ "oficina": 1,"_id": 0 }).sort({'oficina': 'ascending'}).exec();

	var servicios = Modulo.find({}).select({ "servicio": 1,"_id": 0 }).sort({'servicio': 'ascending'}).exec();

	Promise.all([oficinas, servicios])
	.then(function(modulos){

		//console.log(modulos[1]);

		var hash = {};
		oficinas = modulos[0].filter(function(current) {
		  var exists = !hash[current.oficina] || false;
		  hash[current.oficina] = true;
		  return exists;
		});

		var hash = {};
		servicios = modulos[1].filter(function(current) {
		  var exists = !hash[current.servicio] || false;
		  hash[current.servicio] = true;
		  return exists;
		});

		res.render('reports.ejs', {
			"fechaInicio": "2018-01-01",
			"fechaFin": "",
	        "oficinas": oficinas ,
	        "servicios": servicios ,
	        "resultados": false,
	        "labels": [],
	        "data": []
	    });

	}).catch(function(err){
		console.log(err);	
	});
	

});

/* POST Reports page. */

router.post('/', function(req, res, next) {

	var fechaInicio = new Date(req.body.fechaInicio).toISOString();
	var fechaFin = new Date(req.body.fechaFin).toISOString();
	var oficina = req.body.oficina;
	var servicio = req.body.servicio;

	console.log ("fecha:" + fechaInicio);
	console.log ("fecha:" + req.body.fechaInicio);
	console.log ("fecha:" + fechaFin);
	console.log ("fecha:" + req.body.fechaFin);

	console.log ("Oficina:" + oficina);
	console.log ("Servicio:" + servicio);

	Modulo.find({"oficina": oficina, "servicio": servicio, "estado": true, "perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} })
	.limit(10)
	.sort({'perAtendidas.fechaInicio': 'ascending'})
	.exec()
	.then(function(modulos){		

		var fechas = [];
		var personasAtendidas = [];


        modulos.forEach(function(modulo){
        	console.log("Fecha: " + modulo.fecha + ", se atendió a " + modulo.indicePerAtendidas + " personas");
            fechas.push(modulo.fecha);
            personasAtendidas.push(modulo.indicePerAtendidas);
        });

        //console.log(labels);

		res.render('reports.ejs', {
			"fechaInicio": req.body.fechaInicio,
			"fechaFin": req.body.fechaFin,
	        "oficinas": [{"oficina": oficina}] ,
	        "servicios": [{"servicio": servicio}] ,
	        "resultados": true,
	        "labels": fechas,
	        "data": personasAtendidas
	    });	
	}).catch(function(error){
		console.log(error);
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
