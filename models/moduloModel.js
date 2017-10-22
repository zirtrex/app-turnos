var mongoose = require('mongoose');
var Squema = mongoose.Schema;

mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

var moduloSquema = new Squema({ 
	modulo: String,
	tramite: String,
	indicePerAtendidas: Number,
	perAtendidas: [{indiceAten: Number, fechaInicio: Date, fechaFin: Date, minutosAtendidos: Number}],
	contador: Number,	
	fecha: String,
	estado: Boolean
});

var Modulo = mongoose.model('Modulo', moduloSquema);

module.exports.Modulo = Modulo;