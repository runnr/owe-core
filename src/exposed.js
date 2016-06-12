"use strict";

const resource = require("./resource");

/**
 * Exposes objects as another value when serialized.
 * `expose` uses the `expose` property of object [resources]{@link resource} internally.
 * @module expose
 * @alias exposed
 * @param {!object} obj The object to expose.
 * @param {any} [val] The value that should be used instead of obj when serialized. If not specified and `obj` is an `Error`, `obj.message` will be made enumerable and obj will get itself as its exposed value.
 * @return {object} The exposed object.
 */
function expose(obj, val) {
	if(arguments.length === 1) {
		if(obj instanceof Error)
			Object.defineProperty(obj, "message", {
				enumerable: true,
				value: obj.message
			});

		val = obj;
	}

	return resource(obj, {
		expose: val
	});
}

function subclassError(error) {
	return class extends error {
		constructor(msg) {
			super(msg);

			expose(this);
		}
	};
}

module.exports = Object.assign(expose, {

	/**
	 * An Error constructor that builds exposed errors.
	 * @class
	 * @extends Error
	 */
	Error: subclassError(Error),

	/**
	 * An TypeError constructor that builds exposed errors.
	 * @class
	 * @extends TypeError
	 */
	TypeError: subclassError(TypeError),

	/**
	 * An ReferenceError constructor that builds exposed errors.
	 * @class
	 * @extends ReferenceError
	 */
	ReferenceError: subclassError(ReferenceError),

	/**
	 * An RangeError constructor that builds exposed errors.
	 * @class
	 * @extends RangeError
	 */
	RangeError: subclassError(RangeError),

	/**
	 * An SyntaxError constructor that builds exposed errors.
	 * @class
	 * @extends SyntaxError
	 */
	SyntaxError: subclassError(SyntaxError),

	/**
	 * An URIError constructor that builds exposed errors.
	 * @class
	 * @extends URIError
	 */
	URIError: subclassError(URIError),

	/**
	 * An EvalError constructor that builds exposed errors.
	 * @class
	 * @extends EvalError
	 */
	EvalError: subclassError(EvalError),

	/**
	 * Checks whether a given object is exposed.
	 * @param {any} object The object to check. This can be any value. The method will always return `false` for non-objects.
	 * @return {boolean} `true` if the object is exposed. `false` if not.
	 */
	isExposed(object) {
		return "expose" in resource(object);
	},

	/**
	 * Returns the value an object is exposed with. `undefined` if the given object is not exposed.
	 * @param {any} object The object to look up. This can be any value. The method will always return `undefined` for non-objects.
	 * @return {any} The exposed value of the given object.
	 */
	getValue(object) {
		return resource(object).expose;
	},

	/**
	 * Exposes the given object so that only the given iterable collection of properties will be serialized.
	 * @param {object} obj The object that should be exposed.
	 * @param {Iterable.<string>} properties An iterable collection of property strings that should be exposed.
	 * @return {object} The exposed object.
	 */
	properties(obj, properties) {
		if(!properties || typeof properties !== "object" || !(Symbol.iterator in properties))
			throw new TypeError("The properties to be exposed have to be iterable.");

		return resource(obj, Object.defineProperty({}, "expose", {
			configurable: true,
			enumerable: true,
			get: properties instanceof Map ? () => {
				const result = {};

				for(const [key, value] of properties)
					result[value] = obj[key];

				return result;
			} : () => {
				const result = {};

				for(const property of properties)
					result[property] = obj[property];

				return result;
			}
		}));
	}
});
