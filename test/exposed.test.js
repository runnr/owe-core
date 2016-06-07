"use strict";

const expect = require("expect.js");

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

		expect(exposed(o)).to.be(o);
		expect(exposed(f)).to.be(f);
		expect(exposed(e)).to.be(e);

		expect(exposedValue(o)).to.be.ok();
		expect(exposedValue(f)).to.be.ok();
		expect(exposedValue(e)).to.be.ok();
	});

	it("should expose given objects with data when called with data", () => {
		const o = {};
		const f = () => undefined;
		const e = new Error();

		const data = Symbol("unique");

		expect(exposed(o, data)).to.be(o);
		expect(exposed(f, data)).to.be(f);
		expect(exposed(e, data)).to.be(e);

		expect(exposedValue(o)).to.be(data);
		expect(exposedValue(f)).to.be(data);
		expect(exposedValue(e)).to.be(data);
	});

	describe(".isExposed", () => {
		it("should return true when given an exposed object", () => {
			const o = exposed({});
			const o2 = exposed({}, undefined);
			const f = exposed(() => undefined, true);
			const e = exposed(new Error(), "one");

			expect(exposed.isExposed(o)).to.be(true);
			expect(exposed.isExposed(o2)).to.be(true);
			expect(exposed.isExposed(f)).to.be(true);
			expect(exposed.isExposed(e)).to.be(true);
		});

		it("should return false when given a non exposed object", () => {
			const o = {};
			const f = () => undefined;
			const e = new Error();

			expect(exposed.isExposed(o)).to.be(false);
			expect(exposed.isExposed(f)).to.be(false);
			expect(exposed.isExposed(e)).to.be(false);
		});
	});

	describe(".getValue", () => {
		it("should return the exposed value", () => {
			const o = exposed({});
			const f = exposed(() => undefined, {});
			const e = exposed(new Error(), "one");
			const e2 = exposed(new Error());
			const n = {};

			expect(Object.getOwnPropertyDescriptor(e2, "message")).to.eql({
				value: e2.message,
				enumerable: true,
				writable: false,
				configurable: false
			});
			expect(exposed.getValue(o)).to.be(o);
			expect(exposed.getValue(f)).to.eql({});
			expect(exposed.getValue(e)).to.be("one");
			expect(exposed.getValue(e2)).to.be(e2);
			expect(exposed.getValue(n)).to.be(undefined);
		});
	});

	describe(".properties", () => {
		it("should only accept iterable property lists", () => {
			const err = new TypeError("The properties to be exposed have to be iterable.");

			expect(() => exposed.properties({}, [])).not.to.throwError();
			expect(() => exposed.properties({}, (function* () {}()))).not.to.throwError();
			expect(() => exposed.properties({}, new Set())).not.to.throwError();
			expect(() => exposed.properties({})).to.throwError(err);
			expect(() => exposed.properties({}, null)).to.throwError(err);
			expect(() => exposed.properties({}, "test")).to.throwError(err);
		});

		it("should expose the given properties of an object", () => {
			const o = {
				a: 1,
				b: 2,
				c: 3,
				d: 4
			};

			exposed.properties(o, ["b", "d"]);

			expect(exposedValue(o)).to.eql({
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

			expect(exposedValue(o)).to.eql({
				a: 2,
				c: 4
			});
		});
	});

	describe(".Error instance", () => {
		console.log(exposed);

		const err = new exposed.Error();

		it("should be an Error", () => {
			expect(err).to.be.an(Error);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".TypeError instance", () => {
		const err = new exposed.TypeError();

		it("should be an TypeError", () => {
			expect(err).to.be.an(TypeError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".ReferenceError instance", () => {
		const err = new exposed.ReferenceError();

		it("should be an ReferenceError", () => {
			expect(err).to.be.an(ReferenceError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".RangeError instance", () => {
		const err = new exposed.RangeError();

		it("should be an RangeError", () => {
			expect(err).to.be.an(RangeError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".SyntaxError instance", () => {
		const err = new exposed.SyntaxError();

		it("should be an SyntaxError", () => {
			expect(err).to.be.an(SyntaxError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".URIError instance", () => {
		const err = new exposed.URIError();

		it("should be an URIError", () => {
			expect(err).to.be.an(URIError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".EvalError instance", () => {
		const err = new exposed.EvalError();

		it("should be an EvalError", () => {
			expect(err).to.be.an(EvalError);
		});

		it("should be exposed", () => {
			expect(exposedValue(err)).to.be.ok();
		});
	});
});
