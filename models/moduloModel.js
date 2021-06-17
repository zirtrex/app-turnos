const admin = require("firebase-admin");
const firebase = require('firebase');

var serviceAccount = require("../app-turnos-6624f-firebase-adminsdk-ekay6-b93aea0f85.json");

const firebaseConfig = {
    credential: admin.credential.cert(serviceAccount),
    //databaseURL: 'https://app-turnos-6624f-default-rtdb.firebaseio.com/'   
};

admin.initializeApp(firebaseConfig);
//firebase.analytics();

//const database = admin.database();
const database = admin.firestore();

//database.ref('modulos').push({hola:'hola'});

module.exports.database = database;

/*var mongoose = require('mongoose');
var Squema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/consuladoApp', { useMongoClient: true });
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
}, {usePushEach: true}); //, { versionKey: false }

var Modulo = mongoose.model('Modulo', moduloSquema);

module.exports.Modulo = Modulo;*/
