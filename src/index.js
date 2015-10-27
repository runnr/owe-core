"use strict";

const Api = require("./Api");
const Binding = require("./Binding");
const State = require("./State");

const client = require("./client");

const resourceMap = new WeakMap();

function owe(object, router, closer, type) {
	// An object of the form { router:[function], closer:[function] } can be used as well:
	if(router && typeof router === "object") {

		if(closer !== undefined && arguments.length === 3) {
			type = closer;
			closer = undefined;
		}
		else if(closer !== undefined)
			throw new TypeError("Invalid binding functions.");
		closer = router.closer;
		router = router.router;
	}

	router = typeof router !== "function" ? () => undefined : router;
	closer = typeof closer !== "function" ? () => undefined : closer;

	if(type !== undefined && typeof type !== "symbol") {

		if(typeof type === "object" && type !== null && "valueOf" in type)
			type = type.valueOf();

		if(typeof type === "string" && type in Binding.types)
			type = Binding.types[type];
		else if(typeof type === "boolean")
			type = type ? Binding.types.clone : Binding.types.normal;
		else
			throw new TypeError("Invalid binding type.");
	}

	return Binding.bind(object, router, closer, type);
}

Object.assign(owe, {
	client, State, Binding,

	isBound: Binding.isBound.bind(Binding), // kek.

	api(object, router, closer, type) {
		if(!Binding.isBound(object) || arguments.length > 1)
			object = owe(object, router, closer, type);

		return new Api(object);
	},

	isApi(api) {
		return api && typeof api === "object" && api instanceof Api || false;
	},

	resource(object, data) {
		if(data === undefined)
			return resourceMap.get(object) || {};

		if((typeof object !== "object" || object === null) && typeof object !== "function" || resourceMap.has(object))
			throw new TypeError("Could not transform given object into a resource.");

		if(typeof data !== "object" || data === null)
			throw new TypeError("Resource data has to be an object.");

		resourceMap.set(object, data);

		return object;
	}
});

module.exports = owe;
