"use strict";

const expect = require("chai").expect;

const resource = require("../src/resource");

describe("resource", () => {
	it("should return an empty object for everything without a resource", () => {
		expect(resource({})).to.deep.equal({});
		expect(resource(() => undefined)).to.deep.equal({});
		expect(resource(null)).to.deep.equal({});
		expect(resource(undefined)).to.deep.equal({});
		expect(resource(0)).to.deep.equal({});
		expect(resource(NaN)).to.deep.equal({});
		expect(resource(Infinity)).to.deep.equal({});
		expect(resource("test")).to.deep.equal({});
		expect(resource(1)).to.deep.equal({});
		expect(resource(true)).to.deep.equal({});
		expect(resource(Symbol("test"))).to.deep.equal({});
	});

	it("should throw when assigning a resource to a basic type", () => {
		expect(() => resource(null, {})).to.throw();
		expect(() => resource(0, {})).to.throw();
		expect(() => resource(undefined, {})).to.throw();
		expect(() => resource(55, {})).to.throw();
		expect(() => resource("test", {})).to.throw();
		expect(() => resource(true, {})).to.throw();
		expect(() => resource(Symbol("test"), {})).to.throw();
	});

	it("should throw when assigning a basic type to an object", () => {
		expect(() => resource({}, null)).to.throw();
		expect(() => resource({}, 0)).to.throw();
		expect(() => resource({}, 55)).to.throw();
		expect(() => resource({}, "test")).to.throw();
		expect(() => resource({}, true)).to.throw();
		expect(() => resource({}, Symbol("test"))).to.throw();
	});

	it("should assign an object resource to an object that can then be read", () => {
		const a = {};
		const b = {};

		const test = resource(a, b);

		expect(test).to.equal(a);

		expect(resource(a)).to.equal(b);
	});
});
