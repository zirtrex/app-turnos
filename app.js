require('events').EventEmitter.prototype._maxListeners = 0;
var express = require('express');
var http = require('http');
var router = express.Router();
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
const admin = require("firebase-admin");
var database = require('./models/moduloModel').database;
var moment = require('moment');
var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});
const logger = log4js.getLogger('cheese');

var index = require('./routes/index');
var modulo = require('./routes/modulo');
var show = require('./routes/show');
//var reports = require('./routes/reports');

var app = express();
var server = http.Server(app); //createServer
var debug = require('debug')('myapp:server');


// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade');
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(methodOverride("_method"));

var COOKIE_SECRET = 'secretencode';
var COOKIE_NAME = 'sid';

var sessionMiddleware = session({
    name: COOKIE_NAME,
    secret: COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'express.sid',
    key: 'express.sid'
});

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


var io = require("socket.io")(server);

app.io = io;

io.on('connection', function(socket) {
    const modulosRef = database.collection('modulos');
    var fecha = new Date();
    var fechaActual = fecha.getFullYear() + "-" + (fecha.getMonth()+1) + "-" + fecha.getDate();

    socket.on('aumentar', async function(datos) {
        var numeros = [];
        var max = 0;
        new Promise(async function(done) {
            const queryRef = await modulosRef.where('servicio', '==', datos.modulo.servicio)
                                        .where('fecha', '==', fechaActual).get();        
            if (!queryRef.empty) {
                queryRef.forEach(doc => {
                    logger.debug("Numero: " + doc.data().contador);
                    numeros.push(doc.data().contador);
                });                
            }
            done();
        }).then(async function(){
            logger.debug("Numeros: " + numeros.toString());
            if (numeros.length > 0) {
                max = Math.max(...numeros);
            }
            logger.debug("Maximo: " + max);

            const queryRef = await modulosRef.where('oficina', '==', datos.modulo.oficina)
                                        .where('servicio', '==', datos.modulo.servicio)
                                        .where('fecha', '==', fechaActual).get();        
            if (!queryRef.empty) {
                var id, modulo;
                queryRef.forEach(doc => {
                    modulo = doc.data();
                    id = doc.id;
                });
                console.log(modulo);
                if (typeof modulo !== 'undefined') {
                    //Construimos el objeto perAtendidas
                    var indicePerAtendidasActual =  modulo.perAtendidas.length - 1; // He cambiado modulo.contador por modulo.perAtendidas.length
                    var fechaFinAnterior = moment();
                    var fechaInicioAnterior = moment(modulo.perAtendidas[indicePerAtendidasActual].fechaInicio.toDate());
                    var fechaInicioActual = moment();
                    var minutosAtendidosAnterior = Math.ceil(fechaFinAnterior.diff(fechaInicioAnterior, "minutes", true));

                    modulo.indicePerAtendidas = indicePerAtendidasActual + 1;
                    modulo.perAtendidas[indicePerAtendidasActual].fechaFin = fechaFinAnterior;
                    modulo.perAtendidas[indicePerAtendidasActual].minutosAtendidos = minutosAtendidosAnterior;
                    modulo.perAtendidas[indicePerAtendidasActual].fueAtendido = datos.atendido;
                    
                    //Elegimos el número más alto y aumentamos en 1
                    modulo.contador = max + 1;
                    modulo.estado = true,
                    modulosRef.doc(id).update(modulo).then(function(){
                        var perAtendidas =  {indiceAten: indicePerAtendidasActual + 1, fechaInicio: fechaInicioActual, fechaFin: null, fueAtendido: null, minutosAtendidos: 0};
                        modulosRef.doc(id).update({
                            'perAtendidas': admin.firestore.FieldValue.arrayUnion(perAtendidas)										
                        });
                        logger.debug("Guardado: " + modulo.toString());
                        logger.debug("Emitiendo desde el contador al canal SHOW_CHANNEL");
                        socket.broadcast.emit('modulo_SHOW_CHANNEL', {'modulo': modulo, 'aumentar': true, 'quitar': false});
                        logger.debug("Emitiendo desde el contador al canal COUNT_CHANNEL");
                        io.emit('modulo_COUNT_CHANNEL', modulo);
                    }).catch(error => {
                        logger.debug("Error: " + modulo.toString());
                    });
                } else {
                    logger.debug("Error al encontrar el módulo, seguro se ha eliminado");
                    io.emit('modulo_COUNT_CHANNEL', {'modulo': modulo, 'error': true, 'msgError': "No se ha podido encontrar la Oficina o el Trámite, por favor recargue la página. Si el problema persiste comuníquese con el administrador del sistema."});
                }
            } else {
                io.emit('modulo_COUNT_CHANNEL', {'modulo': modulo, 'error': true, 'msgError': "No se ha podido encontrar la Oficina o el Trámite, por favor recargue la página. Si el problema persiste comuníquese con el administrador del sistema."});
            }
        });
    });

    socket.on('call_again', async function(datos) {
        const queryRef = await modulosRef.where('oficina', '==', datos.modulo.oficina)
                                        .where('servicio', '==', datos.modulo.servicio)
                                        .where('fecha', '==', fechaActual).get();        
        if (!queryRef.empty) {
            logger.debug("Call Again: Emitiendo desde el contador al SHOW_CHANNEL");
            var modulo;
			queryRef.forEach(doc => {
				modulo = doc.data();
			});
            socket.broadcast.emit('modulo_SHOW_CHANNEL', {'modulo': modulo, 'aumentar': false, 'quitar': false});
        }
    });

    socket.on('terminar', async function(datos) {
        const queryRef = await modulosRef.where('oficina', '==', datos.modulo.oficina)
                                        .where('servicio', '==', datos.modulo.servicio)
                                        .where('fecha', '==', fechaActual).get();        
        if (!queryRef.empty) {
            var id, modulo;
            queryRef.forEach(doc => {
                modulo = doc.data();
                id = doc.id;
            });
            if (modulo) {
                var indicePerAtendidasActual =  modulo.indicePerAtendidas;

                var fechaInicioActual = new Date(modulo.perAtendidas[indicePerAtendidasActual].fechaInicio.toDate());
                var fechaFinActual = new moment();
                var minutosAtendidosActual = Math.ceil(fechaFinActual.diff(fechaInicioActual, "minutes", true));

                modulo.perAtendidas[indicePerAtendidasActual].fechaFin = fechaFinActual;
                modulo.perAtendidas[indicePerAtendidasActual].minutosAtendidos = minutosAtendidosActual;
                modulo.perAtendidas[indicePerAtendidasActual].fueAtendido = datos.atendido;
                modulo.estado = false;

                modulosRef.doc(id).update(modulo).then(() => {               
                    logger.debug("Terminando: " + modulo.toString());
                    socket.broadcast.emit('modulo_SHOW_CHANNEL', {'modulo': modulo, 'aumentar': false, 'quitar': true});
                    
                }).catch(error => {
                    logger.debug("Error: " + error);
                });
            }
        }
    });

});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser(COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/modulo', modulo);
app.use('/show', show);
//app.use('/reports', reports);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.jade');
});

/**
 * Create HTTP server.
 */

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


module.exports = app;
