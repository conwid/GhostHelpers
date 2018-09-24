https://stackoverflow.com/questions/7650071/is-there-a-way-to-create-a-function-from-a-string-with-javascript
function parseFunction(functionAsString) {
    var funcReg = /function *\(([^()]*)\)[ \n\t]*{(.*)}/gmi;
    var match = funcReg.exec(functionAsString.replace(/\n/g, ' '));
    if(match) {
        return new Function(match[1].split(','), match[2]);
    }
    return null;
};

function noop() {
	return '';
}

https://github.com/shannonmoeller/handlebars-group-by
module.exports = function group(list, options) {    
    var options = options || {};
    var inverse = options.inverse || noop;
    var fn = options.fn || noop;
    var groupingPredicate = parseFunction(options.hash.by);
    var keys = [];
    var groups = {};	  
    
    if (!groupingPredicate || !list || !list.length) {
        return inverse(this);
    }

    function addToGroup(item) {
        var groupingKey = groupingPredicate(item);        
        if (keys.indexOf(groupingKey) === -1) {
                keys.push(groupingKey);
            }

        if (!groups[groupingKey]) {
                groups[groupingKey] = {
                    key: groupingKey,
                    items: []
                };
            }

            groups[groupingKey].items.push(item);            
	}

    function renderGroup(buffer, key) {        
		return buffer + fn(groups[key]);
    }

    list.forEach(addToGroup);    
    return keys.reduce(renderGroup, '');        
};