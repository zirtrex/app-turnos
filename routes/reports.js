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

	res.render('reports.ejs', {
        "v": "Algo",
    });

	Console.log("Se ha creado una vista:" + viewData.channel);			
	
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
