var express = require('express');
var router = express.Router();
var database = require('../models/moduloModel').database;
const admin = require("firebase-admin");
var moment = require('moment');
var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});
const logger = log4js.getLogger('cheese');

const saveDocument = async function (oficina, servicio) {
	const modulosRef = database.collection('modulos');
	var fecha = new Date();
	var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var fechaFormat = days[fecha.getDay()] + " " + months[fecha.getMonth()] + " " + fecha.getDate() + " " + fecha.getFullYear();
	
	//Verificamos si existen las sesiones para oficina y servicio
	//Si no existe alguna de ellas redirigimos al formulario para iniciar sesión
	if ( typeof oficina === 'undefined' || typeof servicio === 'undefined' ) {
		return null	
	//Si existen las variables de sesión creamos el registro
	} else {
		var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();

		const queryRef = await modulosRef.where('oficina', '==', oficina)
																		.where('servicio', '==', servicio)
																		.where('fecha', '==', fechaActual).get();		
		//Si el documento aún no existe creamos uno nuevo
		if (queryRef.empty) {
			const data = {
				'oficina': oficina,
				'servicio': servicio,
				'indicePerAtendidas': 0,			
				'perAtendidas': [],
				'contador': 0,
				'fecha': fechaActual,
				'estado': true
			};
			const insert = await modulosRef.add(data);
			var perAtendidas =  {indiceAten: 0, fechaInicio: moment(), fechaFin: null, fueAtendido: null, minutosAtendidos: 0};
			await modulosRef.doc(insert.id).update({
				'perAtendidas': admin.firestore.FieldValue.arrayUnion(perAtendidas)
			});
			logger.debug("Nuevo[GET]: " + data);
			return {
				'mensaje': 'insert',
				'fechaAct': fechaFormat,
				'modulo': data
			};
		} else {
			var modulo;
			queryRef.forEach(doc => {
				//console.log(doc.id, '=>', doc.data());
				modulo = doc.data();
				modulosRef.doc(doc.id).update({
					'estado': true									
				});
			});
			logger.debug("Ya existe[GET]: " + modulo);
			return {
				'mensaje': 'update',
				'fechaAct': fechaFormat,
				'modulo': modulo
			};
		}
	}		
}

/* GET modulo page. */
router.get('/', async function(req, res, next) {
	var response = await saveDocument(req.session.oficina, req.session.servicio);
	if (response == null) {
		res.redirect('/');
	} else {
		res.render('modulo.html', {'fechaAct': response.fechaAct, 'modulo': response.modulo});
	}
});

/* POST modulo page. */
router.post('/', async function(req, res, next) {	
	req.session.oficina = req.body.oficina;
	req.session.servicio = req.body.servicio;
	var response = await saveDocument(req.session.oficina, req.session.servicio);	
	res.render('modulo.html', {'fechaAct': response.fechaAct, 'modulo': response.modulo});
});

module.exports = router;