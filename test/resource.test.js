"use strict";

const expect = require("expect.js");

const resource = require("../src/resource");

describe("resource", () => {
	it("should return an empty object for everything without a resource", () => {
		expect(resource({})).to.eql({});
		expect(resource(() => undefined)).to.eql({});
		expect(resource(null)).to.eql({});
		expect(resource(undefined)).to.eql({});
		expect(resource(0)).to.eql({});
		expect(resource(NaN)).to.eql({});
		expect(resource(Infinity)).to.eql({});
		expect(resource("test")).to.eql({});
		expect(resource(1)).to.eql({});
		expect(resource(true)).to.eql({});
		expect(resource(Symbol("test"))).to.eql({});
	});

	it("should throw when assigning a resource to a basic type", () => {
		expect(() => resource(null, {})).to.throwError();
		expect(() => resource(0, {})).to.throwError();
		expect(() => resource(undefined, {})).to.throwError();
		expect(() => resource(55, {})).to.throwError();
		expect(() => resource("test", {})).to.throwError();
		expect(() => resource(true, {})).to.throwError();
		expect(() => resource(Symbol("test"), {})).to.throwError();
	});

	it("should throw when assigning a basic type to an object", () => {
		expect(() => resource({}, null)).to.throwError();
		expect(() => resource({}, 0)).to.throwError();
		expect(() => resource({}, 55)).to.throwError();
		expect(() => resource({}, "test")).to.throwError();
		expect(() => resource({}, true)).to.throwError();
		expect(() => resource({}, Symbol("test"))).to.throwError();
	});

	it("should assign an object resource to an object that can then be read", () => {
		const a = {};
		const b = {};

		const test = resource(a, b);

		expect(test).to.be(a);

		expect(resource(a)).to.be(b);
	});
});
