"use strict";

const expect = require("chai").expect;

const owe = require("../src");
const exposed = owe.exposed;

function exposedValue(o) {
	return owe.resource(o).expose;
}

describe(".exposed", () => {
	it("should expose given objects when called", () => {
		const o = {};
		const f = () => undefined;
		const e = new Error();

		expect(exposed(o)).to.equal(o);
		expect(exposed(f)).to.equal(f);
		expect(exposed(e)).to.equal(e);

		expect(exposedValue(o)).to.equal(o);
		expect(exposedValue(f)).to.equal(f);
		expect(exposedValue(e)).to.equal(e);
	});

	it("should expose given objects with data when called with data", () => {
		const o = {};
		const f = () => undefined;
		const e = new Error();

		const data = Symbol("unique");

		expect(exposed(o, data)).to.equal(o);
		expect(exposed(f, data)).to.equal(f);
		expect(exposed(e, data)).to.equal(e);

		expect(exposedValue(o)).to.equal(data);
		expect(exposedValue(f)).to.equal(data);
		expect(exposedValue(e)).to.equal(data);
	});

	describe(".isExposed", () => {
		it("should return true when given an exposed object", () => {
			const o = exposed({});
			const o2 = exposed({}, undefined);
			const f = exposed(() => undefined, true);
			const e = exposed(new Error(), "one");

			expect(exposed.isExposed(o)).to.equal(true);
			expect(exposed.isExposed(o2)).to.equal(true);
			expect(exposed.isExposed(f)).to.equal(true);
			expect(exposed.isExposed(e)).to.equal(true);
		});

		it("should return false when given a non exposed object", () => {
			const o = {};
			const f = () => undefined;
			const e = new Error();

			expect(exposed.isExposed(o)).to.equal(false);
			expect(exposed.isExposed(f)).to.equal(false);
			expect(exposed.isExposed(e)).to.equal(false);
		});
	});

	describe(".getValue", () => {
		it("should return the exposed value", () => {
			const o = exposed({});
			const f = exposed(() => undefined, {});
			const e = exposed(new Error(), "one");
			const e2 = exposed(new Error());
			const n = {};

			expect(Object.getOwnPropertyDescriptor(e2, "message")).to.deep.equal({
				value: e2.message,
				enumerable: true,
				writable: false,
				configurable: false
			});
			expect(exposed.getValue(o)).to.equal(o);
			expect(exposed.getValue(f)).to.deep.equal({});
			expect(exposed.getValue(e)).to.equal("one");
			expect(exposed.getValue(e2)).to.equal(e2);
			expect(exposed.getValue(n)).to.equal(undefined);
		});
	});

	describe(".properties", () => {
		it("should only accept iterable property lists", () => {
			const err = [TypeError, "The properties to be exposed have to be iterable."];

			expect(() => exposed.properties({}, [])).not.to.throw();
			expect(() => exposed.properties({}, (function* () {}()))).not.to.throw();
			expect(() => exposed.properties({}, new Set())).not.to.throw();
			expect(() => exposed.properties({})).to.throw(...err);
			expect(() => exposed.properties({}, null)).to.throw(...err);
			expect(() => exposed.properties({}, "test")).to.throw(...err);
		});

		it("should expose the given properties of an object", () => {
			const o = {
				a: 1,
				b: 2,
				c: 3,
				d: 4
			};

			exposed.properties(o, ["b", "d"]);

			expect(exposedValue(o)).to.deep.equal({
				b: 2,
				d: 4
			});
		});

		it("should expose and map object properties when given a map", () => {
			const o = {
				a: 1,
				b: 2,
				c: 3,
				d: 4
			};

			exposed.properties(o, new Map([
				["b", "a"],
				["d", "c"]
			]));

			expect(exposedValue(o)).to.deep.equal({
				a: 2,
				c: 4
			});
		});
	});

	describe(".Error instance", () => {
		console.log(exposed);

		const err = new exposed.Error();

		it("should be an Error", () => {
			expect(err).to.be.an.instanceof(Error);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});

	describe(".TypeError instance", () => {
		const err = new exposed.TypeError();

		it("should be an TypeError", () => {
			expect(err).to.be.an.instanceof(TypeError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});

	describe(".ReferenceError instance", () => {
		const err = new exposed.ReferenceError();

		it("should be an ReferenceError", () => {
			expect(err).to.be.an.instanceof(ReferenceError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});

	describe(".RangeError instance", () => {
		const err = new exposed.RangeError();

		it("should be an RangeError", () => {
			expect(err).to.be.an.instanceof(RangeError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});

	describe(".SyntaxError instance", () => {
		const err = new exposed.SyntaxError();

		it("should be an SyntaxError", () => {
			expect(err).to.be.an.instanceof(SyntaxError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});

	describe(".URIError instance", () => {
		const err = new exposed.URIError();

		it("should be an URIError", () => {
			expect(err).to.be.an.instanceof(URIError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});

	describe(".EvalError instance", () => {
		const err = new exposed.EvalError();

		it("should be an EvalError", () => {
			expect(err).to.be.an.instanceof(EvalError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok;
		});
	});
});
