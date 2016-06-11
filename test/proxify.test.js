"use strict";

const expect = require("chai").expect;

const Api = require("../src/Api");
const ClientApi = require("../src/ClientApi");
const proxify = require("../src/proxify");
const {
	revert: unproxify,
	passthrough
} = proxify;

describe("proxify and unproxify", () => {
	const objectGenerator = () => ({
		route() {},
		close() {},
		a() {
			return this;
		},
		b: true,
		[passthrough]: new Set(["a", "b"])
	});

	it("should offer a proxify and an unproxify function", () => {
		expect(proxify).to.be.a("function");
		expect(unproxify).to.be.a("function");
	});

	describe("proxify", () => {
		it("should return a proxied function for objects with owe Apis", () => {
			expect(proxify(objectGenerator())).to.be.a("function");
			expect(proxify(Object.create(objectGenerator()))).to.be.a("function");
			expect(proxify(new Api())).to.be.a("function");
			expect(proxify(new ClientApi())).to.be.a("function");
		});

		it("should throw for non objects and objects that do not offer an owe Api interface", () => {
			expect(() => proxify(null)).to.throw();
			expect(() => proxify()).to.throw();
			expect(() => proxify(1)).to.throw();
			expect(() => proxify("test")).to.throw();
			expect(() => proxify(Symbol("test"))).to.throw();
			expect(() => proxify(false)).to.throw();
			expect(() => proxify(() => {})).to.throw();
			expect(() => proxify(Object.assign(() => {}, objectGenerator()))).to.throw();

			expect(() => proxify({})).to.throw();
			expect(() => proxify(new Promise(() => {}))).to.throw();
			expect(() => proxify({
				route: true,
				close: true,
				then: true,
				catch: true
			})).to.throw();
		});

		it("should translate property lookups to route calls", () => {
			const a = [];
			const b = [];

			const o = Object.assign(objectGenerator(), {
				route(destination) {
					a.push(destination);

					return q;
				}
			});
			const q = Object.assign(objectGenerator(), {
				route(destination) {
					b.push(destination);

					return o;
				}
			});

			const p = proxify(o);

			expect(p.test).to.be.a("function");
			expect(a).to.deep.equal(["test"]);
			expect(p.a1.b1.a2.b2.a3.b3).to.be.a("function");
			expect(a).to.deep.equal(["test", "a1", "a2", "a3"]);
			expect(b).to.deep.equal(["b1", "b2", "b3"]);
		});

		it("should translate calls to close calls", () => {
			const o = Object.assign(objectGenerator(), {
				close() {
					return "hello world";
				}
			});

			expect(proxify(o)()).to.equal("hello world");
		});

		it("should list no own keys", () => {
			expect(Object.keys(proxify(objectGenerator()))).to.deep.equal([]);
		});

		it("should have a null prototype", () => {
			expect(Object.getPrototypeOf(proxify(objectGenerator()))).to.equal(null);
		});

		it("should not be extendable or changeable", () => {
			const o = objectGenerator();
			const p = proxify(o);

			expect(Object.isExtensible(p)).to.equal(false);
			expect(() => p.a = 1).to.throw();
			expect(Reflect.deleteProperty(p, "a")).to.equal(false);
			expect(() => Object.defineProperty(p, "x", {
				value: 1
			})).to.throw();
		});

		it("should pass through all calls of methods listed in an Apis proxify.paththough property", () => {
			const o = objectGenerator();
			const p = proxify(o);

			expect(p.a()).to.equal(o);
			expect(p.b).to.equal(true);

			// then and catch are functions:
			expect(proxify(new Api()).then).to.be.a("function");
			expect(proxify(new Api()).catch).to.be.a("function");
			expect(proxify(new ClientApi()).then).to.be.a("function");
			expect(proxify(new ClientApi()).catch).to.be.a("function");

			// Api proxies however are functions as well, so that case has to be excluded:
			expect(unproxify(proxify(new Api()).then)).to.equal(undefined);
			expect(unproxify(proxify(new Api()).catch)).to.equal(undefined);
			expect(unproxify(proxify(new ClientApi()).then)).to.equal(undefined);
			expect(unproxify(proxify(new ClientApi()).catch)).to.equal(undefined);

			// then and catch must also return promises to exclude the case that some other methods were returned by the proxy:
			expect(proxify(new Api()).then(() => {})).to.be.a("promise");
			expect(proxify(new Api()).catch(() => {})).to.be.a("promise");
			expect(proxify(new ClientApi()).then(() => {})).to.be.a("promise");
			expect(proxify(new ClientApi()).catch(() => {})).to.be.a("promise");
		});
	});

	describe("passthrough", () => {
		it("should be a symbol", () => {
			expect(passthrough).to.be.a("symbol");
		});

		it("should be a the key for a set of 'then' and 'catch' in Api and ClientApi", () => {
			expect(Api.prototype[passthrough]).to.deep.equal(new Set(["then", "catch"]));
			expect(ClientApi.prototype[passthrough]).to.deep.equal(new Set(["then", "catch"]));
		});
	});
});
