/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const EventEmitter = require("events");

const client = require("../src/client");
const ClientApi = require("../src/ClientApi");

describe("client", () => {
	describe(".call() result", () => {
		it("should return a ClientApi instance for a given protocol", () => {
			const protocol = {
				a: 1,
				b: 2,
				c: 3,
				init() {},
				closer() {}
			};
			const api = client(protocol);

			expect(api).to.be.a(ClientApi);
			expect(api.protocol.init).to.be(protocol.init);
			expect(api.protocol.closer).to.be(protocol.closer);
			expect(api.protocol.a).to.be(protocol.a);
			expect(api.protocol.b).to.be(protocol.b);
			expect(api.protocol.c).to.be(protocol.c);
			expect(api.protocol).to.be.an(EventEmitter);
		});

		it("should call the init method of the given protocol", () => {
			let x = false;

			client({
				a: 1,
				init() {
					x = true;
					expect(this).to.be.an(EventEmitter);
					expect(this.a).to.be(1);
				},
				closer() {}
			});

			expect(x).to.be(true);
		});

		it("should throw if given an invalid protocol", () => {
			expect(() => client()).to.throwError();
			expect(() => client("x")).to.throwError();
			expect(() => client(1)).to.throwError();
			expect(() => client(undefined)).to.throwError();
			expect(() => client(() => undefined)).to.throwError();
			expect(() => client(Symbol("test"))).to.throwError();
			expect(() => client(true)).to.throwError();
			expect(() => client({})).to.throwError();
			expect(() => client({
				init: true,
				closer: true
			})).to.throwError();
			expect(() => client({
				init() {}
			})).to.throwError();
			expect(() => client({
				closer() {}
			})).to.throwError();
			expect(() => client({
				init: {},
				closer() {}
			})).to.throwError();
			expect(() => client({
				init() {},
				closer: {}
			})).to.throwError();
		});
	});

	describe(".isApi()", () => {
		it("should return 'false' for everything that is not an instance of Api", () => {
			expect(client.isApi()).to.be(false);
			expect(client.isApi(undefined)).to.be(false);
			expect(client.isApi(null)).to.be(false);
			expect(client.isApi(123.456)).to.be(false);
			expect(client.isApi("test")).to.be(false);
			expect(client.isApi(NaN)).to.be(false);
			expect(client.isApi(Infinity)).to.be(false);
			expect(client.isApi({})).to.be(false);
			expect(client.isApi(() => undefined)).to.be(false);
			expect(client.isApi(ClientApi)).to.be(false);
			expect(client.isApi(Object.create(ClientApi))).to.be(false);
			expect(client.isApi(Symbol("test"))).to.be(false);
		});

		it("should return 'true' for everything that is an instance of Api", () => {
			expect(client.isApi(new ClientApi())).to.be(true);
			expect(client.isApi(Object.create(new ClientApi()))).to.be(true);
			expect(client.isApi(Object.create(ClientApi.prototype))).to.be(true);
		});
	});
});
