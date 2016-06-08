"use strict";

const expect = require("expect.js");

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
			expect(() => proxify(null)).to.throwError();
			expect(() => proxify()).to.throwError();
			expect(() => proxify(1)).to.throwError();
			expect(() => proxify("test")).to.throwError();
			expect(() => proxify(Symbol("test"))).to.throwError();
			expect(() => proxify(false)).to.throwError();
			expect(() => proxify(() => {})).to.throwError();
			expect(() => proxify(Object.assign(() => {}, objectGenerator()))).to.throwError();

			expect(() => proxify({})).to.throwError();
			expect(() => proxify(new Promise(() => {}))).to.throwError();
			expect(() => proxify({
				route: true,
				close: true,
				then: true,
				catch: true
			})).to.throwError();
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
			expect(a).to.eql(["test"]);
			expect(p.a1.b1.a2.b2.a3.b3).to.be.a("function");
			expect(a).to.eql(["test", "a1", "a2", "a3"]);
			expect(b).to.eql(["b1", "b2", "b3"]);
		});

		it("should translate calls to close calls", () => {
			const o = Object.assign(objectGenerator(), {
				close() {
					return "hello world";
				}
			});

			expect(proxify(o)()).to.be("hello world");
		});

		it("should list no own keys", () => {
			expect(Object.keys(proxify(objectGenerator()))).to.eql([]);
		});

		it("should have a null prototype", () => {
			expect(Object.getPrototypeOf(proxify(objectGenerator()))).to.be(null);
		});

		it("should not be extendable or changeable", () => {
			const o = objectGenerator();
			const p = proxify(o);

			expect(Object.isExtensible(p)).to.be(false);
			expect(() => p.a = 1).to.throwError();
			expect(Reflect.deleteProperty(p, "a")).to.be(false);
			expect(() => Object.defineProperty(p, "x", {
				value: 1
			})).to.throwError();
		});

		it("should pass through all calls of methods listed in an Apis proxify.paththough property", () => {
			const o = objectGenerator();
			const p = proxify(o);

			expect(p.a()).to.be(o);
			expect(p.b).to.be(true);

			// then and catch are functions:
			expect(proxify(new Api()).then).to.be.a("function");
			expect(proxify(new Api()).catch).to.be.a("function");
			expect(proxify(new ClientApi()).then).to.be.a("function");
			expect(proxify(new ClientApi()).catch).to.be.a("function");

			// Api proxies however are functions as well, so that case has to be excluded:
			expect(unproxify(proxify(new Api()).then)).to.be(undefined);
			expect(unproxify(proxify(new Api()).catch)).to.be(undefined);
			expect(unproxify(proxify(new ClientApi()).then)).to.be(undefined);
			expect(unproxify(proxify(new ClientApi()).catch)).to.be(undefined);

			// then and catch must also return promises to exclude the case that some other methods were returned by the proxy:
			expect(proxify(new Api()).then(() => {})).to.be.a(Promise);
			expect(proxify(new Api()).catch(() => {})).to.be.a(Promise);
			expect(proxify(new ClientApi()).then(() => {})).to.be.a(Promise);
			expect(proxify(new ClientApi()).catch(() => {})).to.be.a(Promise);
		});
	});

	describe("passthrough", () => {
		it("should be a symbol", () => {
			expect(passthrough).to.be.a("symbol");
		});

		it("should be a the key for a set of 'then' and 'catch' in Api and ClientApi", () => {
			expect(Api.prototype[passthrough]).to.eql(new Set(["then", "catch"]));
			expect(ClientApi.prototype[passthrough]).to.eql(new Set(["then", "catch"]));
		});
	});
});
