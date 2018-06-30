function formatDate(date){
    var pad = function(num) {
        var s = '0' + num;
        return s.substr(s.length - 2);
    }
    var Result = date.getFullYear() + '-' + pad((date.getMonth() + 1)) + '-' + pad(date.getDate());
    return Result;
}

 /**
 * Ingresar el array de Objetos a filtrar y el campo a filtrar
 * @param  {Array, String}
 * @return  {Array}
 */
function eliminarDuplicados(data, field){
	field = "current." + field;
    var hash = {};
	dataFilter = data.filter(function(current) {
	  var exists = !hash[eval(field)] || false;
	  hash[eval(field)] = true;
	  return exists;
	});
	return dataFilter;
}

module.exports = {formatDate, eliminarDuplicados};