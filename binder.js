proxyHandler = {
	set: function (target, key, value) {
		console.log('Updating proxy: target,key,value...',target, key, value);
		//assign the new value to our main object
		target[key] = value;
		//remember that we already have a proxy for the next time
		//send updates the the elements that registered to us
		if(!target.hasOwnProperty('__binds')){return};
		if(!target.__binds.hasOwnProperty(key)){return};
		for (var i =0; i< target.__binds[key].length; i++){
			console.log('OBJ changed... we need to update the html elements binded to it', target.__binds[key][i]);
			var htmlItem = target.__binds[key][i].targetHtmlElement;;
			var htmlItemAttribute = target.__binds[key][i].targetHtmlElementAttribute;
			
			//restore the original string in the html element (the one before the tags replacing)
			htmlItem[htmlItemAttribute] = htmlItem.dataset['originalval'+htmlItemAttribute];
			
			//replace the tags with the new values
			replaceTags(htmlItem, htmlItem.dataset['originalval'+htmlItemAttribute])
		}
		return true; 
	},
	get(target, property) {
		// Intercept property access
		if (property === 'bindToHtmlElement') {
			// Add a new method to the proxy
			return function(propertyName, htmlElement, htmlElementAttribute) {
				console.log(`We are binding ${propertyName} to ${htmlElement} attribute ${htmlElementAttribute}`);
				
				if(!target.hasOwnProperty('__binds')){
					console.log(`Target had no binds yet, fixing it!`);
					target.__binds = [];
				};
				if(!target.__binds.hasOwnProperty(propertyName)){
					console.log(`Target had no binds for this property yet, fixing it!`);
					target.__binds[propertyName] = [];
				};
					
				//if not already stored (we only want to store it the first time to prevent some string already been replaced)
				//remember the original value of the html attribute
				console.log('bool: originalval'+htmlElementAttribute);
				//console.log('bool: ', htmlElement.hasAttribute('originalval'+htmlElementAttribute));
				console.log('bool: ', (!(('originalval'+htmlElementAttribute) in htmlElement.dataset)));
				//if(!htmlElement.hasAttribute('originalval'+htmlElementAttribute)){
				if(!(('originalval'+htmlElementAttribute) in htmlElement.dataset)){
					htmlElement.dataset['originalval'+htmlElementAttribute] = htmlElement[htmlElementAttribute];
					console.log(htmlElement);
				}
				//register the html elements as one that will receive updates from us
				target.__binds[propertyName].push({
					targetHtmlElement: htmlElement,
					targetHtmlElementAttribute: htmlElementAttribute,
					targetHtmlOriginalValue: htmlElement[htmlElementAttribute]
				});
				
				//bind
				//htmlElement[htmlElementAttribute]=target[propertyName];
				replaceTags(htmlElement, htmlElement.dataset['originalval'+htmlElementAttribute])
				
				//bind back
				htmlElement.addEventListener('keyup', (event) => {
					console.log('html changed, firing the event back to the original js obj (obj, property, newvalue)', target, propertyName, htmlElement[htmlElementAttribute]);
					this[propertyName] = htmlElement[htmlElementAttribute];
				});

			};
		}
		return target[property];
	},
}



//scorro l'html e cerco se c'è qualche elemento che ha un bind (cerco nell'innerHtml e in value)
//se un elemento richiede di essere bindato ad una o più proprieta di un oggetto
//per ogni proprietà/oggetto
//verifico se l'oggetto ha già un proxy attaccato
//se non ce l'ha glielo creo
//se c'è registro nel proxy che anche io voglio ricevere le modifiche di quella proprietà
//(a sua volta dovrei registrare un proxy su di me per comunicare in caso le modifiche siano mie da ritrasmettere all'origine) (2 way binding)

//devo ricordare la mia stringa originale (prima di aver rimpiazzato i tag)
//in modo da poterla riutilizzare le prossime volte che ricevo un aggiornamento

//se un cambiamento avviene lato js propago verso html
//se il cambiamento avviene lato html cambio il js così verrà ripetuto il cambio html a cascata sugli altri elementi

//aggiorno in real time or only every x ammount of time?


var game = new Proxy({},proxyHandler);
game.name='Primo Gioco1';
game.test= new Proxy({},proxyHandler);;
game.test.nome='Gionni';
game.test.cognome='Brun';
game.test.eta='24';
game.inventory = new Proxy({},proxyHandler);
game.inventory.quick= Array(
	new Proxy({name:'mela',val:10,quantity:1},proxyHandler),
	new Proxy({name:'pera',val:10,quantity:1},proxyHandler),
	new Proxy({name:'banan',val:10,quantity:1},proxyHandler),
	new Proxy({name:'caffe',val:10,quantity:1},proxyHandler)
);
game.inventory.backpack= Array(
	new Proxy({name:'libro',val:10,quantity:1},proxyHandler),
	new Proxy({name:'chiave',val:10,quantity:2},proxyHandler),
	new Proxy({name:'bottiglia',val:10,quantity:3},proxyHandler),
	new Proxy({name:'cerotto',val:10,quantity:1},proxyHandler)
);

/*
function set(path, value) {
	var schema = window;  // a moving reference to internal objects within obj
	var pList = path.split('.');
	var len = pList.length;
	for(var i = 0; i < len-1; i++) {
		var elem = pList[i];
		if( !schema[elem] ) schema[elem] = {}
			schema = schema[elem];
		}
	schema[pList[len-1]] = value;
}
*/

function replaceTag (tag, target, targetAttribute){
	//remove the {{, the }}, and split by .
	var subProp = tag.replace('{{','').replace('}}','').split('.'); 
	
	//find the global object of witch we need the value
	var currentObjState = window;
	var parentObj = window
	var propName = null;
	
	for (var i = 0; i < subProp.length; i++) {
		parentObj = currentObjState;
		propName = subProp[i];
		currentObjState = currentObjState[subProp[i]];
	}
	
	//assign the value to the bind
	target[targetAttribute] = target[targetAttribute].replaceAll(tag, currentObjState)
}
function replaceTags(target){
	var attributesToCheck =['value', 'innerHTML'];

	attributesToCheck.forEach(function(attribute){
		//if the item does not have an attribute continue with the next property
		if(attribute=='value'){
			if( !target.hasAttribute('value')){
				return;
			}
		}
		
		//find possible binds in value
		const regex = /{{(.*?)}}/gm;
		var binds = target[attribute].matchAll(regex);
		
		//for each binded HTML property
		for (const bind of binds) {
			replaceTag(bind[0], target, attribute);
		}
	});
}
       
function getGlobalVarByTag (tag){
	//remove the {{, the }}, and split by .
	var subProp = tag.replace('{{','').replace('}}','').split('.'); 
	
	//find the global object of witch we need the value
	var currentObjState = window;
	var parentObj = window
	var propName = null;
	
	for (var i = 0; i < subProp.length; i++) {
		parentObj = currentObjState;
		propName = subProp[i];
		currentObjState = currentObjState[subProp[i]];
	}
  return currentObjState;
}

//binding of arrays
var arrayBind = document.querySelectorAll('[data-bind-foreach]');
for (let item of arrayBind) {
	var newHtml ='';
	var sourceArray = item.dataset.BindForeach;
	var htmlSchema = item.dataset.bindAs;
	//find possible binds in value
	var regex = /{{item.(.*?)}}/gm;
	attribute = 'innerHTML';
	var binds = [...item['innerHTML'].matchAll(regex)];
	myarray= getGlobalVarByTag(item.dataset.bindForeach);
	var originalHTML = item[attribute];
	for(var i=0; i < myarray.length; i++){
		var itemHtml = originalHTML;
		for (var h=0; h < binds.length; h++){
			var name = binds[h][1];
			itemHtml = itemHtml.replaceAll('{{item.'+name+'}}', myarray[i][name]);
		}
		newHtml += itemHtml;
	}
  item.innerHTML = newHtml;
}




//binding of a single value
//find all html elements that want to bind (register) to some object

var htmlElementsWithBindings = document.querySelectorAll('[data-bind]');
for (let htmlElement of htmlElementsWithBindings) {
	console.log('Found an HTML element that want to bind: ', htmlElement);
	var attributesToCheck =['value', 'innerHTML'];

	//go trought the html attributes that we want to check for bindings
	attributesToCheck.forEach(function(htmlAttribute){
		//if the item does not have an attribute continue with the next property
		if(htmlAttribute=='value'){
			if( !htmlElement.hasAttribute('value')){
				return;
			}
		}

		//search for tags in this attribute
		const regex = /{{(.*?)}}/gm;
		var binds = htmlElement[htmlAttribute].matchAll(regex);

		//for each tag/binding we found in this attribute
		for (const bind of binds) {
			console.log('     want to bin his property: ', htmlAttribute);
			console.log('     to: ', bind[1]);
			//get the sub property
			var subProp = bind[0].replace('{{','').replace('}}','').split('.'); 

			var currentObjState = window;
			var parentObj = window
			var propName = null;
			for (var i = 0; i < subProp.length; i++) {
				parentObj = currentObjState;
				propName = subProp[i];
				currentObjState = currentObjState[subProp[i]];
			}
			
			//manual bind
			parentObj.bindToHtmlElement(propName,htmlElement,htmlAttribute)

//		  //remove the {{, the }}, and split by .
//			var jsProperty = bind[0].replace('{{','').replace('}}','').split('.'); 

		}
	});
}





//manual bind
//game.bindToHtmlElement('name',document.getElementById('nameInput'),'value')


