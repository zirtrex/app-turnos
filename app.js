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
var Modulo = require('./models/moduloModel').Modulo;
var log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger('cheese');


var index = require('./routes/index');
var modulo = require('./routes/modulo');
var show = require('./routes/show');

var app = express();
var server = http.Server(app); //createServer
var debug = require('debug')('myapp:server');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);


app.use(methodOverride("_method"));

var MONGO_URL = 'mongodb://localhost:27017/test';
var COOKIE_SECRET = 'secretencode';
var COOKIE_NAME = 'sid';

var sessionMiddleware = session({
    name: COOKIE_NAME,
    secret: COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'express.sid',
    key: 'express.sid',
    store: new MongoStore({
        url: MONGO_URL,
        autoReconnect: true
    })
});

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


var io = require("socket.io")(server);

app.io = io;

io.on('connection', function(socket) {

    var fecha = new Date();
    var fechaActual = fecha.getFullYear() + "-" + fecha.getMonth() + "-" + fecha.getDate();

    socket.on('aumentar', function(datos){

        var numeros = [];
        var max;

        new Promise(function(done){
            Modulo.find({'tramite': datos.modulo.tramite, 'fecha': fechaActual}, function(err, modulos){

                for(var i = 0; i < modulos.length; i++){
                    
                    logger.debug("Numero: " + modulos[i].contador);
                    numeros.push(modulos[i].contador);

                }

                done();

            }); 
        }).then(function(){

            logger.debug("Numeros: " + numeros.toString());
            max = Math.max(...numeros); logger.debug("Maximo: " + max);

            Modulo.findOne({'modulo': datos.modulo.modulo, 'tramite': datos.modulo.tramite, 'fecha': fechaActual}, function(err, modulo){
    
                //Construimos el objeto perAtendidas
                var indicePerAtendidasActual =  modulo.indicePerAtendidas + 1;
                var fechaFinAnterior = new Date();
                var fechaInicioAnterior = new Date(modulo.perAtendidas[indicePerAtendidasActual-1].fechaInicio);
                var fechaInicioActual = new Date();
                var minutosAtendidosAnterior = fechaFinAnterior.getTime() - fechaInicioAnterior.getTime();
                
                var perAtendidas =  {indiceAten: indicePerAtendidasActual, fechaInicio: fechaInicioActual, fechaFin: null, minutosAtendidos: 0};
                
                modulo.indicePerAtendidas = indicePerAtendidasActual;
                modulo.perAtendidas[indicePerAtendidasActual-1].fechaFin = fechaFinAnterior;
                modulo.perAtendidas[indicePerAtendidasActual-1].minutosAtendidos = Math.round(minutosAtendidosAnterior / 1000 / 60);
                modulo.perAtendidas.push(perAtendidas);
                //Elegimos el número más alto y aumentamos en 1
                modulo.contador = max + 1;
                modulo.estado = true,

                modulo.save(function (err) {
                    if (err) {
                        logger.debug(err);
                    } else {
                        logger.debug("Guardado: " + modulo.toString());                      
                        logger.debug("Emitiendo desde el contador al canal SHOW_CHANNEL");
                        socket.broadcast.emit('modulo_SHOW_CHANNEL', modulo); 
                        logger.debug("Emitiendo desde el contador al canal COUNT_CHANNEL");
                        io.emit('modulo_COUNT_CHANNEL', modulo); 
                    }
                });

            });

        });

    });

    socket.on('call_again', function(datos){

        Modulo.findOne({'modulo': datos.modulo.modulo, 'tramite': datos.modulo.tramite, 'fecha': fechaActual}, function(err, modulo){

            logger.debug("Emitiendo desde al SHOW_CHANNEL");
            socket.broadcast.emit('modulo_SHOW_CHANNEL', modulo); 

        });

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
