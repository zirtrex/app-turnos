var mongoose = require('mongoose');
var Squema = mongoose.Schema;

mongoose.connect('mongodb://rafael:ZTRse7en@ds229465.mlab.com:29465/heroku_qzv4b77t', { useMongoClient: true }); 
//mongodb://localhost:27017/consuladoApp mongodb://rafael:ZTRse7en@ds229465.mlab.com:29465/heroku_qzv4b77t
mongoose.Promise = global.Promise;

var moduloSquema = new Squema({
	oficina: String,
	servicio: String,
	indicePerAtendidas: Number,
	perAtendidas: [{
		indiceAten: Number,
		fechaInicio: Date,
		fechaFin: Date,
		fueAtendido: Boolean,
		minutosAtendidos: Number}],
	contador: Number,
	fecha: String,
	estado: Boolean
}); //, { versionKey: false }

var Modulo = mongoose.model('Modulo', moduloSquema);

module.exports.Modulo = Modulo;
