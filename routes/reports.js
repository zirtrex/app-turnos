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

		res.render('reporte_general.ejs', {
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

/* POST Reporte General. */

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
	.sort({'perAtendidas.fechaInicio': 'descending'})
	.exec()
	.then(function(modulos){		

		var fechas = [];
		var personasAtendidas = [];
		var promMinutosAtendidos = [];


        modulos.forEach(function(modulo){
        	console.log("Fecha: " + modulo.fecha + ", se atendió a " + modulo.indicePerAtendidas + " personas");
            fechas.push(modulo.fecha);
            personasAtendidas.push(modulo.indicePerAtendidas);

            var sumatoria = 0;

            for(var i = 1; i < modulo.perAtendidas.length; i++){
                    
                sumatoria+= modulo.perAtendidas[i].minutosAtendidos;

            }

            var promedio = Math.round(sumatoria / modulo.perAtendidas.length - 1);

            promMinutosAtendidos.push(promedio);

        });

        //console.log(labels);

		res.render('reporte_general.ejs', {
			"fechaInicio": req.body.fechaInicio,
			"fechaFin": req.body.fechaFin,
	        "oficinas": [{"oficina": oficina}] ,
	        "servicios": [{"servicio": servicio}] ,
	        "resultados": true,
	        "labels": fechas.reverse(),
	        "personasAtendidas": personasAtendidas.reverse(),
	        "promMinutosAtendidos": promMinutosAtendidos.reverse()
	    });	
	}).catch(function(error){
		console.log(error);
	});

});

/* GET Reporte por Trámite.  */

router.get('/servicio', function(req, res, next) {

	console.log("Se ha creado el reporte de servicios:");

	var fecha = new Date();
	var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();

	var servicios = Modulo.find({}).select({ "servicio": 1,"_id": 0 }).sort({'servicio': 'ascending'}).exec();

	Promise.all([servicios])
	.then(function(modulos){

		var hash = {};
		servicios = modulos[0].filter(function(current) {
		  var exists = !hash[current.servicio] || false;
		  hash[current.servicio] = true;
		  return exists;
		});

		res.render('reporte_servicio.ejs', {
			"fechaInicio": "2018-01-01",
			"fechaFin": "2018-04-12",
	        "servicios": servicios,
	        "resultados": false,
	        "labels": [],
	        "data": []
	    });

	}).catch(function(err){
		console.log(err);	
	});
	

});


/* POST Reporte por Trámite. */

router.post('/servicio', function(req, res, next) {

	var fechaInicio = new Date(req.body.fechaInicio).toISOString();
	var fechaFin = new Date(req.body.fechaFin).toISOString();
	var servicio = (req.body.servicio) ? req.body.servicio : "";

	console.log ("Fecha Inicio:" + req.body.fechaInicio);
	console.log ("Fecha Fin:" + req.body.fechaFin);
	console.log ("Servicio:" + servicio);

	if(servicio != ""){
		var modulos = Modulo.find({"servicio": servicio, "perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).sort({'perAtendidas.fechaInicio': 'descending'}).exec();
	}else{
		var modulos = Modulo.find({"perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).exists('servicio', true).sort({'perAtendidas.fechaInicio': 'descending'}).exec();
	}
	
	modulos.then(function(modulos){		

		var servicios = [];
		var serviciosLabel = [];
		var personasAtendidas = [];
		var promMinutosAtendidos = [];
		var serviciosUnique = [];
		var serviciosFinal = [];

        modulos.forEach(function(modulo){
        	console.log("Servicios: " + modulo.servicio + ", se atendió a " + modulo.indicePerAtendidas + " personas");

            var sumatoria = 0, promedio = 0;

            if(modulo.perAtendidas.length > 0){

            	for(var i = 1; i < modulo.perAtendidas.length; i++){
            	                   
                	sumatoria+= modulo.perAtendidas[i].minutosAtendidos;
                }

                promedio = Math.round(sumatoria / modulo.perAtendidas.length);

            }           

            servicios.push({"servicio" : modulo.servicio, "pA": modulo.indicePerAtendidas, "pMA": promedio});

        });

        var hash = {};
		serviciosUnique = servicios.filter(function(current) {
		  var exists = !hash[current.servicio] || false;
		  hash[current.servicio] = true;
		  return exists;
		});

		serviciosUnique.forEach(function(servicioU){

			
			var pA = 0 , pMA = 0 , cantidad = 0;

			for(var i = 0; i < servicios.length; i++){

				if(servicioU.servicio == servicios[i].servicio){

					pA += servicios[i].pA;
					pMA += servicios[i].pMA;
					cantidad++;

				}

			}

			serviciosFinal.push({"servicio" : servicioU.servicio, "pA": pA, "pMA": Math.round(pMA / cantidad)});

		});

		serviciosFinal.forEach(function(servicio){
			
			serviciosLabel.push(servicio.servicio);
			personasAtendidas.push(servicio.pA);
			promMinutosAtendidos.push(servicio.pMA);
			
		});


		//console.log(serviciosUnique);
        console.log(serviciosFinal);
        

		res.render('reporte_servicio.ejs', {
			"fechaInicio": req.body.fechaInicio,
			"fechaFin": req.body.fechaFin,
	        "servicios": [{"servicio": servicio}] ,
	        "resultados": true,
	        "labels": serviciosLabel,
	        "personasAtendidas": personasAtendidas,
	        "promMinutosAtendidos": promMinutosAtendidos,
	        "serviciosFinal" : serviciosFinal
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
