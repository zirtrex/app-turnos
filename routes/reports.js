var express = require('express');
var router = express.Router();
var Modulo = require('../models/moduloModel').Modulo;
var path    = require("path");
var log4js = require('log4js');
var util = require('../models/util');
var PDFDocument = require('pdfkit');

log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');


/* GET Reporte General. */
router.get('/', function(req, res, next) {

	console.log("Se ha creado la página principal de reporte:");

	var fechaInicio = new Date("2018-01-01").toISOString();
	var fechaFin = new Date().toISOString();

	console.log ("Fecha Inicio:" + fechaInicio);
	console.log ("Fecha Fin:" + fechaFin);

	var modulosQuery = Modulo.find({"perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).sort({'perAtendidas.fechaInicio': 'descending'}).exec();	
	

	modulosQuery.then(function(modulos){

		var personasAtendidas = [];
		var promMinutosAtendidos = [];
		var resultadoPrevio = [];
		var resultadoFinal = [];

        modulos.forEach(function(modulo){            

            var sumatoria = 0, promedio=0;

            console.log(modulo.perAtendidas.length);

            if(modulo.perAtendidas.length > 1){

            	for(var i = 1; i < modulo.perAtendidas.length; i++){
                    
                	sumatoria+= modulo.perAtendidas[i].minutosAtendidos;

            	}
            	promedio = Math.round(sumatoria / modulo.perAtendidas.length);

	            personasAtendidas.push(modulo.perAtendidas.length - 1);
	            promMinutosAtendidos.push(promedio);

	            resultadoPrevio.push({"pA": modulo.perAtendidas.length - 1, "pMA": promedio});
        	}

        });
        
			
		var pA = 0 , pMA = 0 , cantidad = 0;

		for(var i = 0; i < resultadoPrevio.length; i++){				

			pA += resultadoPrevio[i].pA;
			pMA += resultadoPrevio[i].pMA;
			cantidad++;				

		}

		personasAtendidas.push(pA);
		promMinutosAtendidos.push(pMA);
		resultadoFinal.push({"pA": pA, "pMA": Math.round(pMA / cantidad)});

        console.log(resultadoFinal);

		res.render('reporte_general.ejs', {
	        "resultados": true,
	        "personasAtendidas": personasAtendidas,
	        "promMinutosAtendidos": promMinutosAtendidos,
	        "resultadoFinal" : resultadoFinal
	    });	

	}).catch(function(error){
		console.log(error);
	});

});

/* GET Reports page. */
router.get('/dias', function(req, res, next) {

	console.log("Se ha creado la página de reporte por días:");

	var fecha = new Date();

	var oficinas = Modulo.find({}).select({ "oficina": 1,"_id": 0 }).sort({'oficina': 'ascending'}).exec();

	var servicios = Modulo.find({}).select({ "servicio": 1,"_id": 0 }).sort({'servicio': 'ascending'}).exec();

	Promise.all([oficinas, servicios])
	.then(function(modulos){

		oficinas = util.eliminarDuplicados(modulos[0], "oficina");

		servicios = util.eliminarDuplicados(modulos[1], "servicio");

		res.render('reporte_dias.ejs', {
			"fechaInicio": "2018-01-01",
			"fechaFin": util.formatDate(fecha),
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
router.post('/dias', function(req, res, next) {

	var fechaInicio = new Date(req.body.fechaInicio).toISOString();
	var fechaFin = new Date(req.body.fechaFin).toISOString();
	var oficina = (req.body.oficina) ? req.body.oficina : "";
	var servicio = (req.body.servicio) ? req.body.servicio : "";

	console.log ("Fecha Inicio:" + req.body.fechaInicio);
	console.log ("Fecha Fin:" + req.body.fechaFin);
	console.log ("Oficina:" + oficina);
	console.log ("Servicio:" + servicio);

	if(oficina != "" && servicio != ""){
		var modulosQuery = Modulo.find({"oficina": oficina, "servicio": servicio, "perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).limit(30).sort({'perAtendidas.fechaInicio': 'descending'}).exec();
	}else if(oficina != "" && servicio == ""){
		var modulosQuery = Modulo.find({"oficina": oficina, "perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).limit(30).sort({'perAtendidas.fechaInicio': 'descending'}).exec();
	}else if(oficina == "" && servicio != ""){
		var modulosQuery = Modulo.find({"servicio": servicio, "perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).limit(30).sort({'perAtendidas.fechaInicio': 'descending'}).exec();	
	}else{
		var modulosQuery = Modulo.find({"perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).limit(30).sort({'perAtendidas.fechaInicio': 'descending'}).exec();	
	}

	modulosQuery.then(function(modulos){

		var fechasLabels = [];
		var personasAtendidas = [];
		var promMinutosAtendidos = [];
		var resultadoFinal = [];

        modulos.forEach(function(modulo){            

            var sumatoria = 0, promedio=0;

            console.log(modulo.perAtendidas.length);

            if(modulo.perAtendidas.length > 1){

            	for(var i = 1; i < modulo.perAtendidas.length; i++){
                    
                	sumatoria+= modulo.perAtendidas[i].minutosAtendidos;

            	}
            	promedio = Math.round(sumatoria / modulo.perAtendidas.length);

            	fechasLabels.push(modulo.fecha);           
	            personasAtendidas.push(modulo.perAtendidas.length - 1);
	            promMinutosAtendidos.push(promedio);

	            resultadoFinal.push({"fecha" : modulo.fecha, "oficina": modulo.oficina,"servicio": modulo.servicio,"pA": modulo.perAtendidas.length - 1, "pMA": promedio});
        	}

        });

        //console.log(resultadoFinal);

		res.render('reporte_dias.ejs', {
			"fechaInicio": req.body.fechaInicio,
			"fechaFin": req.body.fechaFin,
	        "oficinas": [{"oficina": oficina}] ,
	        "servicios": [{"servicio": servicio}] ,
	        "resultados": true,
	        "labels": fechasLabels.reverse(),
	        "personasAtendidas": personasAtendidas.reverse(),
	        "promMinutosAtendidos": promMinutosAtendidos.reverse(),
	        "resultadoFinal" : resultadoFinal.reverse()
	    });	

	}).catch(function(error){
		console.log(error);
	});

});

/* GET Reporte por Servicios.  */
router.get('/servicio', function(req, res, next) {

	console.log("Se ha creado el reporte de servicios:");

	var fecha = new Date();

	var servicios = Modulo.find({}).select({ "servicio": 1,"_id": 0 }).sort({'servicio': 'ascending'}).exec();

	Promise.all([servicios])
	.then(function(modulos){

		var serviciosSelect = util.eliminarDuplicados(modulos[0], "servicio");

		res.render('reporte_servicio.ejs', {
			"fechaInicio": "2018-01-01",
			"fechaFin": util.formatDate(fecha),
	        "servicios": serviciosSelect,
	        "resultados": false,
	        "labels": [],
	        "data": []
	    });

	}).catch(function(err){
		console.log(err);	
	});	

});


/* POST Reporte por Servicios. */
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

            var sumatoria = 0, promedio = 0;

            if(modulo.perAtendidas.length > 1){

            	for(var i = 1; i < modulo.perAtendidas.length; i++){
            	                   
                	sumatoria+= modulo.perAtendidas[i].minutosAtendidos;
                }

                promedio = Math.round(sumatoria / modulo.perAtendidas.length);

                servicios.push({"servicio" : modulo.servicio, "pA": modulo.perAtendidas.length - 1, "pMA": promedio});

            }   

        });

		serviciosUnique = util.eliminarDuplicados(servicios, "servicio");

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


/* GET Reporte por Oficina.  */
router.get('/oficina', function(req, res, next) {

	console.log("Se ha creado el reporte de oficinas:");

	var fecha = new Date();

	var oficinas = Modulo.find({}).select({ "oficina": 1,"_id": 0 }).sort({'oficina': 'ascending'}).exec();

	Promise.all([oficinas])
	.then(function(modulos){

		var oficinasSelect = util.eliminarDuplicados(modulos[0], "oficina");

		res.render('reporte_oficina.ejs', {
			"fechaInicio": "2018-01-01",
			"fechaFin": util.formatDate(fecha),
	        "oficinas": oficinasSelect,
	        "resultados": false,
	        "labels": [],
	        "data": []
	    });

	}).catch(function(err){
		console.log(err);	
	});	

});


/* POST Reporte por Oficina. */
router.post('/oficina', function(req, res, next) {

	var fechaInicio = new Date(req.body.fechaInicio).toISOString();
	var fechaFin = new Date(req.body.fechaFin).toISOString();
	var oficina = (req.body.oficina) ? req.body.oficina : "";

	console.log ("Fecha Inicio:" + req.body.fechaInicio);
	console.log ("Fecha Fin:" + req.body.fechaFin);
	console.log ("Oficina:" + oficina);

	if(oficina != ""){
		var modulos = Modulo.find({"oficina": oficina, "perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).sort({'oficina': 1}).exec();
	}else{
		var modulos = Modulo.find({"perAtendidas.fechaInicio": {  $gte : fechaInicio, $lte : fechaFin} }).exists('servicio', true).sort({'oficina': 1}).exec();
	}
	
	modulos.then(function(modulos){		

		var oficinas = [];
		var oficinasLabel = [];
		var personasAtendidas = [];
		var promMinutosAtendidos = [];
		var oficinasUnique = [];
		var oficinasFinal = [];

        modulos.forEach(function(modulo){        	

            var sumatoria = 0, promedio = 0;

            if(modulo.perAtendidas.length > 1){

            	for(var i = 1; i < modulo.perAtendidas.length; i++){
            	                   
                	sumatoria+= modulo.perAtendidas[i].minutosAtendidos;
                }

                promedio = Math.round(sumatoria / modulo.perAtendidas.length);

                oficinas.push({"oficina" : modulo.oficina, "pA": modulo.perAtendidas.length - 1, "pMA": promedio});

            }   

        });

		oficinasUnique = util.eliminarDuplicados(oficinas, "oficina");

		oficinasUnique.forEach(function(oficinaU){
			
			var pA = 0 , pMA = 0 , cantidad = 0;

			for(var i = 0; i < oficinas.length; i++){

				if(oficinaU.oficina == oficinas[i].oficina){

					pA += oficinas[i].pA;
					pMA += oficinas[i].pMA;
					cantidad++;
				}

			}

			oficinasFinal.push({"oficina" : oficinaU.oficina, "pA": pA, "pMA": Math.round(pMA / cantidad)});

		});

		oficinasFinal.forEach(function(oficina){
			
			oficinasLabel.push(oficina.oficina);
			personasAtendidas.push(oficina.pA);
			promMinutosAtendidos.push(oficina.pMA);
			
		});

		//console.log(serviciosUnique);
        console.log(oficinasFinal);        

		res.render('reporte_oficina.ejs', {
			"fechaInicio": req.body.fechaInicio,
			"fechaFin": req.body.fechaFin,
	        "oficinas": [{"oficina": oficina}] ,
	        "resultados": true,
	        "labels": oficinasLabel,
	        "personasAtendidas": personasAtendidas,
	        "promMinutosAtendidos": promMinutosAtendidos,
	        "oficinasFinal" : oficinasFinal
	    });

	}).catch(function(error){
		console.log(error);
	});

});

/* POST Reporte por Oficina PDF. */
router.get('/oficina/pdf', (req, res) => {
  const doc = new PDFDocument()

  // Setting response to 'attachment' (download).
  // If you use 'inline' here it will automatically open the PDF
  res.setHeader('Content-disposition', 'attachment; filename="' + 'demo.pdf' + '"');
  res.setHeader('Content-type', 'application/pdf');
  const content = "req.body.content";
  doc.y = 300;
  doc.text(content, 50, 50);
  doc.pipe(res);
  doc.end();
})


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
