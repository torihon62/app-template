const puppeteer = require('puppeteer');
const fs = require('fs');

const inflector = new Inflector();

async function getHtmlContents(page, url){
  await page.goto(url) // ページへ移動
  // 任意のJavaScriptを実行
  return await page.$eval('html', item => {
		return item.innerHTML;
	});
}

function getRoutes(html) {
	const tdRoutePath = html.match(/<td data-route-path=".*?"(.|\s)*?<p>(.|\s)*?<\/p>(.|\s)*?<\/td>/g);
	let routes = [];
	if (tdRoutePath) {
		for (let i = 0, l = tdRoutePath.length; i < l; i++) {
			if (!tdRoutePath[i].match(/(active_storage|action_mailbox)/)) {
				const targetStr = tdRoutePath[i].replace(/<td data-route-path="(.*?)"(.|\s)*?<p>(.*?)<\/p>(.|\s)*?<\/td>/, '{"path": "$1", "action": "$3"}').replace("(.:format)", "");
				routes.push(JSON.parse(targetStr));
			}
		}
	}
	return routes;
}

function getModels(routes) {
	let models = [];
	routes.forEach(route => {
		const action = route.action;
		const model = action.split("#")[0];
		models.push(model);
	});
	return models.filter((x, i, self) => self.indexOf(x) === i);
}

function getSchemas(models) {
	let schemas = {};
	const schema_rb = fs.readFileSync("../api/db/schema.rb", 'utf8').toString().split(/\n/).join("<br>");

	models.forEach(model => {
		schemas[model] = [];
		schemas[model].push({
			name: 'id',
			type: 'integer',
			options: {
				required: true
			},
		})
		const regExp = new RegExp(`create_table "${model}".*?end<br>`, 'g');
		const tables = regExp.exec(schema_rb);
		if (tables) {
			tables.forEach(table => {
				const records = table.match(/t\..*?<br>/g);
				records.forEach(record => {
					const schemaProps = JSON.parse(record.replace(/t\.(.*?)\s"(.*?)"(.*?)<br>/, '{"name": "$2", "type": "$1", "options": "$3"}'));
					const name = schemaProps.name;
					const type = schemaProps.type;
					const options = schemaProps.options !== '' ? schemaProps.options.split(',') : [];
					let schemaOptions = {};
					for (const option of options) {
						if (option === '') continue;

						const optionProps = option.split(':');
						const optionName = optionProps[0].trim();
						const optionValue = optionProps[1].trim();
						schemaOptions[optionName] = optionValue;
					}
					schemas[model].push({
						name: name,
						type: type,
						options: schemaOptions,
					})
				})
			});
		}
	});
	return schemas;
}

function getOAS(schemas) {
	let oas = {};
	oas.openapi = '3.0.0';
	oas.info = {};
	oas.info.title = 'TODO';
	oas.info.version = '1.0.0';
	oas.servers = [];
	oas.servers.push({url: 'http://localhost:3000', description: 'dev server'});
	oas.paths = {};
	
	for (const schema in schemas) {
		const modelName = inflector.singularize(schema).charAt(0).toUpperCase() + inflector.singularize(schema).slice(1);

		oas.paths[`/${schema}`] = {};
		oas.paths[`/${schema}/{id}`] = {};

		// oas.paths[`/${schema}`].get
		oas.paths[`/${schema}`].get = {};
		oas.paths[`/${schema}`].get.tags = [schema];
		oas.paths[`/${schema}`].get.summary = `Get all ${schema}`;
		oas.paths[`/${schema}`].get.description = `Returns an array of ${modelName} model`;
		oas.paths[`/${schema}`].get.parameters = [];
		for (const properties of schemas[schema]) {
			if (properties.name === 'created_at' || properties.name === 'updated_at') continue;
			oas.paths[`/${schema}`].get.parameters.push({
				name: properties.name,
				in: 'query',
				required: false,
				schema: {type: properties.type.replace('datetime', 'date-time')},
			});
		}
		oas.paths[`/${schema}`].get.responses = {};
		oas.paths[`/${schema}`].get.responses['200'] = {};
		oas.paths[`/${schema}`].get.responses['200'].description = `A JSON array of ${modelName} model`;
		oas.paths[`/${schema}`].get.responses['200'].content = {};
		oas.paths[`/${schema}`].get.responses['200'].content['application/json'] = {};
		oas.paths[`/${schema}`].get.responses['200'].content['application/json'].schema = {};
		oas.paths[`/${schema}`].get.responses['200'].content['application/json'].schema.type = 'array';
		oas.paths[`/${schema}`].get.responses['200'].content['application/json'].schema.items = {};
		oas.paths[`/${schema}`].get.responses['200'].content['application/json'].schema.items['$ref'] = `#/components/schemas/${modelName}_ResponseBody`;

		// oas.paths[`/${schema}`].post
		oas.paths[`/${schema}`].post = {};
		oas.paths[`/${schema}`].post.tags = [schema];
		oas.paths[`/${schema}`].post.summary = `Create a new ${modelName}`;
		oas.paths[`/${schema}`].post.description = `Create a new ${modelName}`;
		oas.paths[`/${schema}`].post.parameters = [];
		oas.paths[`/${schema}`].post.requestBody = {};
		oas.paths[`/${schema}`].post.requestBody.description = `${modelName} to create`;
		oas.paths[`/${schema}`].post.requestBody.content = {};
		oas.paths[`/${schema}`].post.requestBody.content['application/json'] = {};
		oas.paths[`/${schema}`].post.requestBody.content['application/json'].schema = {'$ref': `#/components/schemas/${modelName}_RequestBody`};
		oas.paths[`/${schema}`].post.responses = {};
		oas.paths[`/${schema}`].post.responses['201'] = {};
		oas.paths[`/${schema}`].post.responses['201'].description = 'CREATED';

		// oas.paths[`/${schema}/{id}`].get
		oas.paths[`/${schema}/{id}`].get = {};
		oas.paths[`/${schema}/{id}`].get.tags = [schema];
		oas.paths[`/${schema}/{id}`].get.summary = `Get ${modelName} by ID.`;
		oas.paths[`/${schema}/{id}`].get.description = `Returns a single ${modelName} model`;
		oas.paths[`/${schema}/{id}`].get.parameters = [{
			name: 'id',
			in: 'path',
			required: true,
			schema: {type: 'integer'}
		}];
		oas.paths[`/${schema}/{id}`].get.responses = {};
		oas.paths[`/${schema}/{id}`].get.responses['200'] = {};
		oas.paths[`/${schema}/{id}`].get.responses['200'].description = `A single ${modelName} model`;
		oas.paths[`/${schema}/{id}`].get.responses['200'].content = {};
		oas.paths[`/${schema}/{id}`].get.responses['200'].content['application/json'] = {};
		oas.paths[`/${schema}/{id}`].get.responses['200'].content['application/json'].schema = {};
		oas.paths[`/${schema}/{id}`].get.responses['200'].content['application/json'].schema.type = 'object';
		oas.paths[`/${schema}/{id}`].get.responses['200'].content['application/json'].schema.items = {};
		oas.paths[`/${schema}/{id}`].get.responses['200'].content['application/json'].schema.items['$ref'] = `#/components/schemas/${modelName}_ResponseBody`;

		// oas.paths[`/${schema}/{id}`].put
		oas.paths[`/${schema}/{id}`].put = {};
		oas.paths[`/${schema}/{id}`].put.tags = [schema];
		oas.paths[`/${schema}/{id}`].put.summary = `Update a ${modelName}`;
		oas.paths[`/${schema}/{id}`].put.description = `Update a ${modelName}`;
		oas.paths[`/${schema}/{id}`].put.parameters = [{
			name: 'id',
			in: 'path',
			required: true,
			schema: {type: 'integer'}
		}];
		oas.paths[`/${schema}/{id}`].put.requestBody = {};
		oas.paths[`/${schema}/{id}`].put.requestBody.description = `${modelName} to update`;
		oas.paths[`/${schema}/{id}`].put.requestBody.content = {};
		oas.paths[`/${schema}/{id}`].put.requestBody.content['application/json'] = {};
		oas.paths[`/${schema}/{id}`].put.requestBody.content['application/json'].schema = {'$ref': `#/components/schemas/${modelName}_RequestBody`};
		oas.paths[`/${schema}/{id}`].put.responses = {};
		oas.paths[`/${schema}/{id}`].put.responses['204'] = {};
		oas.paths[`/${schema}/{id}`].put.responses['204'].description = 'UPDATED';

		// oas.paths[`/${schema}/{id}`].patch
		oas.paths[`/${schema}/{id}`].patch = {};
		oas.paths[`/${schema}/{id}`].patch.tags = [schema];
		oas.paths[`/${schema}/{id}`].patch.summary = `Update a ${modelName}`;
		oas.paths[`/${schema}/{id}`].patch.description = `Update a ${modelName}`;
		oas.paths[`/${schema}/{id}`].patch.parameters = [{
			name: 'id',
			in: 'path',
			required: true,
			schema: {type: 'integer'}
		}];
		oas.paths[`/${schema}/{id}`].patch.requestBody = {};
		oas.paths[`/${schema}/{id}`].patch.requestBody.description = `${modelName} to update`;
		oas.paths[`/${schema}/{id}`].patch.requestBody.content = {};
		oas.paths[`/${schema}/{id}`].patch.requestBody.content['application/json'] = {};
		oas.paths[`/${schema}/{id}`].patch.requestBody.content['application/json'].schema = {'$ref': `#/components/schemas/${modelName}_RequestBody`};
		oas.paths[`/${schema}/{id}`].patch.responses = {};
		oas.paths[`/${schema}/{id}`].patch.responses['204'] = {};
		oas.paths[`/${schema}/{id}`].patch.responses['204'].description = 'UPDATED';

		// oas.paths[`/${schema}/{id}`].delete
		oas.paths[`/${schema}/{id}`].delete = {};
		oas.paths[`/${schema}/{id}`].delete.tags = [schema];
		oas.paths[`/${schema}/{id}`].delete.summary = `Delete a ${modelName}`;
		oas.paths[`/${schema}/{id}`].delete.description = `Delete a ${modelName}`;
		oas.paths[`/${schema}/{id}`].delete.parameters = [{
			name: 'id',
			in: 'path',
			required: true,
			schema: {type: 'integer'}
		}];
		oas.paths[`/${schema}/{id}`].delete.responses = {};
		oas.paths[`/${schema}/{id}`].delete.responses['204'] = {};
		oas.paths[`/${schema}/{id}`].delete.responses['204'].description = 'DELETED';

	}

	// oas.components
	oas.components = {};
	oas.components.schemas = {};
	for (const schema in schemas) {
		const modelName = inflector.singularize(schema).charAt(0).toUpperCase() + inflector.singularize(schema).slice(1);
		oas.components.schemas[`${modelName}_RequestBody`] = {};
		oas.components.schemas[`${modelName}_RequestBody`].type = 'object';
		oas.components.schemas[`${modelName}_RequestBody`].properties = {};
		for (const properties of schemas[schema]) {
			if (properties.name === 'id' || properties.name === 'created_at' || properties.name === 'updated_at') continue;
			oas.components.schemas[`${modelName}_RequestBody`].properties[properties.name] = {};
			oas.components.schemas[`${modelName}_RequestBody`].properties[properties.name].type = properties.type;
			if (properties.type === 'integer') oas.components.schemas[`${modelName}_RequestBody`].properties[properties.name].format = 'int64';
		}
		oas.components.schemas[`${modelName}_ResponseBody`] = {};
		oas.components.schemas[`${modelName}_ResponseBody`].type = 'object';
		oas.components.schemas[`${modelName}_ResponseBody`].required = [];
		oas.components.schemas[`${modelName}_ResponseBody`].required.push('id');
		oas.components.schemas[`${modelName}_ResponseBody`].properties = {};
		for (const properties of schemas[schema]) {
			oas.components.schemas[`${modelName}_ResponseBody`].properties[properties.name] = {};
			oas.components.schemas[`${modelName}_ResponseBody`].properties[properties.name].type = properties.type.replace('datetime', 'date-time');
			if (properties.type === 'integer') oas.components.schemas[`${modelName}_ResponseBody`].properties[properties.name].format = 'int64';
		}
	}
	return oas;
}

!(async() => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

		const html = await getHtmlContents(page, 'http://localhost:3000/rails/info');
		const routes = getRoutes(html);
		const models = getModels(routes);
		const schemas = getSchemas(models);
		const oasJson = getOAS(schemas);

		fs.writeFileSync("./../api/public/swagger-ui/openapi.json", JSON.stringify(oasJson));
		fs.writeFileSync("./openapi.json", JSON.stringify(oasJson));

		console.log('Generated!!');
    browser.close();
  } catch(e) {
		console.error(e)
  }
})()


function Inflector() {}

Inflector.prototype.pluralRules = {
  pluralRules : {
    '/(s)tatus$/i':'RegExp.$1+"tatuses"',
    '/^(ox)$/i':'RegExp.$1+"en"',
    '/([m|l])ouse$/i':'RegExp.$1+"ice"',
    '/(matr|vert|ind)ix|ex$/i':'RegExp.$1+"ices"',
    '/(x|ch|ss|sh)$/i':'RegExp.$1+"es"',
    '/(r|t|c)y$/i':'RegExp.$1+"ies"',
    '/(hive)$/i':'RegExp.$1+"s"',
    '/(?:([^f])fe|([lr])f)$/i':'RegExp.$1+RegExp.$2+"ves"',
    '/(.*)sis$/i':'RegExp.$1+"ses"',
    '/([ti])um$/i':'RegExp.$1+"a"',
    '/(buffal|tomat)o$/i':'RegExp.$1+"oes"',
    '/(bu)s$/i':'RegExp.$1+"ses"',
    '/(alias)/i':'RegExp.$1+"es"',
    '/(octop|vir)us$/i':'RegExp.$1+"i"',
    '/(.*)s$/i':'RegExp.$1+"s"',
    '/(.*)/i':'RegExp.$1+"s"'
  },
  singularRules : {
    '/(s)tatuses$/i':'RegExp.$1+"tatus"',
    '/^(ox)en$/i':'RegExp.$1',
    '/([m|l])ice$/i':'RegExp.$1+"ouse"',
    '/(matr)ices$/i':'RegExp.$1+"ix"',
    '/(vert|ind)ices$/i':'RegExp.$1+"ex"',
    '/(cris|ax|test)es$/i':'RegExp.$1+"is"', 
    '/(x|ch|ss|sh)es$/i':'RegExp.$1',
    '/(r|t|c)ies$/i':'RegExp.$1+"y"',
    '/(movie)s$/i':'RegExp.$1',
    '/(hive)s$/i':'RegExp.$1',
    '/([^f])ves$/i':'RegExp.$1+"fe"',
    '/([lr])ves$/i':'RegExp.$1+"f"',
    '/(analy|ba|diagno|parenthe|synop|the)ses$/i':'RegExp.$1+"sis"',
    '/([ti])a$/i':'RegExp.$1+"um"',
    '/(buffal|tomat)oes$/i':'RegExp.$1+"o"',
    '/(bu)ses$/i':'RegExp.$1+"s"',
    '/(alias)es/i':'RegExp.$1',
    '/(octop|vir)i$/i':'RegExp.$1+"us"',
    '/(.*)s$/i':'RegExp.$1',
    '/(.*)/i':'RegExp.$1'
  },
  uninflected : [
    'deer', 'fish', 'measles', 'ois', 'pox', 'rice', 'sheep', 'Amoyese', 'bison', 'bream', 'buffalo', 'cantus', 'carp', 'cod', 'coitus', 'corps', 'diabetes', 'elk', 'equipment', 'flounder', 'gallows', 'Genevese', 'Gilbertese', 'graffiti', 'headquarters', 'herpes', 'information', 'innings', 'Lucchese', 'mackerel', 'mews', 'moose', 'mumps', 'news', 'nexus', 'Niasese', 'Pekingese', 'Portuguese', 'proceedings', 'rabies', 'salmon', 'scissors', 'series', 'shears', 'siemens', 'species', 'testes', 'trousers', 'trout', 'tuna', 'whiting', 'wildebeest', 'Yengeese'
  ],
  pluralIrregular : {
    'atlas':'atlases',  'child':'children',
    'corpus':'corpuses', 'ganglion':'ganglions',
    'genus':'genera', 'graffito':'graffiti',
    'leaf':'leaves', 'man':'men', 
    'money':'monies', 'mythos':'mythoi', 
    'numen':'numina', 'opus':'opuses',
    'penis':'penises', 'person':'people',
    'sex':'sexes', 'soliloquy':'soliloquies',
    'testis':'testes', 'woman':'women', 
    'move':'moves'
  },
  singularIrregular : {
    'atlases':'atlas', 'children':'child',
    'corpuses':'corpus', 'ganglions':'ganglion',
    'genera':'genus', 'graffiti':'graffito',
    'leaves':'leaf', 'men':'man', 
    'monies':'money', 'mythoi':'mythos',
    'numina':'numen', 'opuses':'opus',
    'penises':'penises', 'people':'person',
    'sexes':'sex', 'soliloquies':'soliloquy',
    'testes':'testis', 'women':'woman',
    'moves':'move'
  }
}

Inflector.prototype.pluralize = function(word) {
  var word = word;
  for(i in this.pluralRules['uninflected']) {
    if(word.toLowerCase() == this.pluralRules['uninflected'][i]){
      return word;
    }
  }
  for(i in this.pluralRules['pluralIrregular']) {
    if(word.toLowerCase() == i) {
      return word = this.pluralRules['pluralIrregular'][i];
    }
  }
  for(i in this.pluralRules['pluralRules']) {
    try{
      var rObj = eval("new RegExp(" +i+ ");");
      if(word.match(rObj)) {
        word = word.replace(rObj, eval(this.pluralRules['pluralRules'][i]));
        return word;
      }
    }catch(e){
      alert(e.description);
    }
  }
  return word;
}

Inflector.prototype.singularize = function(word) {
  var word = word;
  for(i in this.pluralRules['uninflected']) {
    if(word.toLowerCase() == this.pluralRules['uninflected'][i]){
      return word;
    }
  }
  for(i in this.pluralRules['singularIrregular']) {
    if(word.toLowerCase() == i) {
      return word = this.pluralRules['singularIrregular'][i];
    }
  }
  for(i in this.pluralRules['singularRules']) {
    try{
      var rObj = eval("new RegExp(" +i+ ");");
      if(word.match(rObj)) {
        word = word.replace(rObj, eval(this.pluralRules['singularRules'][i]));
        return word;
      }
    }catch(e){
      alert(e.description);
    }
  }
  return word;
}

Inflector.prototype.addPluralRule = function(pattern, replace) {
  this.pluralRules['pluralRules']["'"+pattern+"'"] = "'"+replace+"'";
}
Inflector.prototype.addSingularRule = function(pattern, replace) {
  this.pluralRules['singularRules']["'"+pattern+"'"] = "'"+replace+"'";
}
Inflector.prototype.addUninflectedRule = function(pattern) {
  this.pluralRules['uninflected'].push("'"+pattern+"'");
}
Inflector.prototype.addPluralIrregularRule = function(pattern, replace) {
  this.pluralRules['pluralIrregular']["'"+pattern+"'"] = "'"+replace+"'";
}
Inflector.prototype.addSingularIrregularRule = function(pattern, replace) {
  this.pluralRules['sinularIrregular']["'"+pattern+"'"] = "'"+replace+"'";
}
