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
var binded = document.querySelectorAll('[data-bind]');
for (let item of binded) {
	var attributesToCheck =['value', 'innerHTML'];

	//for each attribute of this html element that cotain a binding to an object
	attributesToCheck.forEach(function(attribute){
		//if the item does not have an attribute continue with the next property
		if(attribute=='value'){
			if( !item.hasAttribute('value')){
				return;
			}
		}

		//find possible binds in value (find the tags)
		const regex = /{{(.*?)}}/gm;
		var binds = item[attribute].matchAll(regex);

		//for each binded HTML property (for each tag found)
		for (const bind of binds) {
			//se ho trovato almeno un tag mi ricordo la string originale (prima di rimbpiazzare i tag)
			if (!item.hasAttribute('data-bind'+attribute+'-originalval')){
				item.dataset['bind'+attribute+'Originalval'] = item[attribute];
			}

		  //remove the {{, the }}, and split by .
			var subProp = bind[0].replace('{{','').replace('}}','').split('.'); 

			//find the global object of witch we need the value
			var currentObjState = window;
			var parentObj = window
			var propName = null;

			for (var i = 0; i < subProp.length; i++) {
				parentObj = currentObjState;
				propName = subProp[i];
				currentObjState = currentObjState[subProp[i]];
			}
			
			bindedObject = parentObj;
			
			//if the object is a proxy
			//we wanto to register to it as "targets" so that when it will change we will change
			bindedObj = new Proxy(bindedObj, {
							  //obj ,prop, value
				set: function (target, key, value) {
					//assign the new value to our main object
					target[key] = value;
					//remember that we already have a proxy for the next time
					target[_hasProxy] = true;
					
					//for each html element that we have previously ergistered as binded to "us"
					//update his value with our new value
					if(target._binds.hasOwnProperty(key)){
						//for each html element that is "registered to us"
						for (var i =0; i< target._binds[key].length; i++){
							console.log('OBJ changed... we need to update the html elements binded to it');
							var htmlItem = target._binds[key][i].htmlItem;;
							var htmlItemAttribute = target._binds[key][i].htmlItemAttribute;
							
							//restore the original string (the raw sring before we run the bindings proprety changes)
							htmlItem[htmlItemAttribute] = htmlItem.dataset['bind'+htmlItemAttribute+'Originalval'];
							//replace the tags with our values
							replaceTags(htmlItem, htmlItem.dataset['bind'+htmlItemAttribute+'Originalval'])
						}
					}
					return true; 
				},
			});
			
			//replace the obj with our proxy
			//remove the last piece
			var mappedProperty = subProp.pop();
			eval(subProp.join('.')+' = parentObj;');
			//assign in the obj a reference of this bind
			if (!bindedObj.hasOwnProperty('_binds')){
				bindedObj._binds = {};
			}
			if (!bindedObj._binds.hasOwnProperty(mappedProperty)){
				bindedObj._binds[mappedProperty] = [];
			}

			bindedObj._binds[mappedProperty].push({
				htmlItem: item,
				htmlItemAttribute:[attribute],
				htmlOriginalValue: item[attribute],
				objProperty: mappedProperty,
				objFullName: subProp.join('.')+'.'+mappedProperty
			})
			//assign the value to the bind
			item[attribute] = item[attribute].replaceAll(bind[0], currentObjState)

			//two way bindings
			//bind the html to the obj
			item.addEventListener('keyup', (event) => {
				parentObj[propName] = event.target.value;
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
