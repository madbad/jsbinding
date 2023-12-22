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

var __bindings={};
 __bindings.html=[]; //contains a list of html elements that has bindings
						//for each html element
						//a list of js binded property (pointer to js object)
						//the original html
__bindings.js=[]; //contains a list of js elements that has bindings
						//for each js element (pointer to html element)


var game = {};
game.name='Primo Gioco1';
game.test={};
game.test.nome='Gionni';
game.test.cognome='Brun';
game.test.eta='24';
game.inventory = {};
game.inventory.quick= Array({name:'mela',val:10,quantity:1}, {name:'pera',val:10,quantity:1}, {name:'banan',val:10,quantity:1}, {name:'caffe',val:10,quantity:1});
game.inventory.backpack= Array({name:'libro',val:10,quantity:1}, {name:'chiave',val:10,quantity:2}, {name:'bottiglia',val:10,quantity:3}, {name:'cerotto',val:10,quantity:1});


console.log("test");

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


//binding of a single value
//find all html elements that want to bind (register) to some object
var bindedHtmlElements = document.querySelectorAll('[data-bind]');
for (let htmlElement of bindedHtmlElements) {
	console.log('Found an HTML element that want to bind: ', htmlElement);

	var attributesToCheck =['value', 'innerHTML'];

	//for each attribute of this html element that cotain a binding to an object
	attributesToCheck.forEach(function(attribute){
		//if the item does not have an attribute continue with the next property
		if(attribute=='value'){
			if( !htmlElement.hasAttribute('value')){
				return;
			}
		}

		//find possible binds in value (find the tags)
		const regex = /{{(.*?)}}/gm;
		var binds = htmlElement[attribute].matchAll(regex);

		//for each binded HTML property (for each tag found)
		for (const bind of binds) {
			console.log('     want to bin his property: ', attribute);
				console.log('     to: ', bind[1]);


			//se ho trovato almeno un tag mi ricordo la string originale (prima di rimbpiazzare i tag)
			if (!htmlElement.hasAttribute('bindOriginalval'+attribute)){
				htmlElement.dataset['bindOriginalval'+attribute] = htmlElement[attribute];
				//htmlElement.dataset['aaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] = 'test';
			}


			//get the sub property
			var subProp = bind[0].replace('{{','').replace('}}','').split('.'); 
			//find the global object that contain our property (we will need it for attacching the proxy)
			var currentObjState = window;
			var parentObj = window
			var propName = null;
			for (var i = 0; i < subProp.length; i++) {
				parentObj = currentObjState;
				propName = subProp[i];
				currentObjState = currentObjState[subProp[i]];
			}
			bindedObject = parentObj;

		  //remove the {{, the }}, and split by .
			var jsProperty = bind[0].replace('{{','').replace('}}','').split('.'); 
			
			//if the object is a proxy
			if(parentObj.hasOwnProperty('_isProxy')){
				console.log('######', bind[1], " is already a proxy");
				var watchedProperty = subProp.pop();
			}else{
				console.log('    ', bind[1], " is not a proxy");
				console.log('     registering a new proxy for ', bind[1], " with current value of ", eval(bind[1]))
				
				//we wanto to register to it as "targets" so that when it will change we will change
				parentObjProxy = new Proxy(parentObj, {
								  //obj ,prop, value
					//remember that we already setup a proxy for this object
					set: function (target, key, value) {
						console.log('Updating proxy: target,key,value...',target, key, value);
						//assign the new value to our main object
						target[key] = value;
						//remember that we already have a proxy for the next time
						
						console.log('this js property is mapped to these html elements...',target._binds[key]);
						
						//for each html element that we have previously ergistered as binded to "us"
						//update his value with our new value
						
						//if we have no binds we have nothign to do here, quit
						if(!target.hasOwnProperty('_binds')){return};
						if(target._binds.hasOwnProperty(key)){
							//for each html element that is "registered to us"
							for (var i =0; i< target._binds[key].length; i++){
								console.log('OBJ changed... we need to update the html elements binded to it');
								var htmlItem = target._binds[key][i].htmlItem;;
								var htmlItemAttribute = target._binds[key][i].htmlItemAttribute;
								
								//restore the original string (the raw sring before we run the bindings proprety changes)
								htmlItem[htmlItemAttribute] = htmlItem.dataset['bindOriginalval'+htmlItemAttribute];
								//replace the tags with our values
								replaceTags(htmlItem, htmlItem.dataset['bindOriginalval'+htmlItemAttribute])
							}
						}
						return true; 
					},
				});
				
				//replace the obj with our proxy
				//remove the last piece
				var watchedProperty = subProp.pop();
				console.log(parentObj);
				parentObj._isProxy =true;
				console.log(parentObj);
				console.log(parentObjProxy);
				parentObj = parentObjProxy;
				//eval(bind[1]+'=parentObjProxy;')
				//console.log(eval(bind[1]));
				console.log('myproxy ',parentObjProxy);
			}


			
			//the proxy is already setup so
			//assign in the obj a reference of this bind
			if (!parentObj.hasOwnProperty('_binds')){
				parentObj._binds = {};
			}
			if (!parentObj._binds.hasOwnProperty(watchedProperty)){
				parentObj._binds[watchedProperty] = [];
			}

			parentObj._binds[watchedProperty].push({
				htmlItem: htmlElement,
				htmlItemAttribute:[attribute],
				htmlOriginalValue: htmlElement[attribute],
				objProperty: watchedProperty,
				objFullName: subProp.join('.')+'.'+watchedProperty
			})



			//actual string replacements (this could be done later)
			
			//assign the value to the bind 
			htmlElement[attribute] = htmlElement[attribute].replaceAll(bind[0], currentObjState)
			//two way bindings
			//bind the html to the obj
			console.log('      registering an event listener to the html element for ', bind[1]);

			htmlElement.addEventListener('keyup', (event) => {
				console.log('html changed, firing the event back to the original js obj (obj, property, newvalue)', parentObj, propName, event.target.value);
				parentObj[propName] = event.target.value;
				parentObjProxy[propName] = event.target.value;
			});
		}
	});

 

}
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
