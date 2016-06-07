"use strict";

const expect = require("expect.js");

const client = require("../src/client");
const ClientApi = require("../src/ClientApi");

describe("client", () => {
	describe(".call() result", () => {
		it("should return a ClientApi instance for a given protocol", () => {
			const protocol = {
				a: 1,
				b: 2,
				c: 3,
				init() {
					expect(this.connected).to.be(false);
					expect(this.init).to.be(protocol.init);
					expect(this.closer).to.be(protocol.closer);
					expect(this.a).to.be(protocol.a);
					expect(this.b).to.be(protocol.b);
					expect(this.c).to.be(protocol.c);
				},
				closer() {}
			};
			const api = client(protocol);

			expect(api).to.be.a(ClientApi);
		});

		it("should call the init method of the given protocol", () => {
			let x = false;

			client({
				a: 1,
				init() {
					x = true;
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
			})).not.to.throwError();
			expect(() => client({
				init: {},
				closer() {}
			})).to.throwError();
			expect(() => client({
				init() {},
				closer: {}
			})).to.throwError();
		});

		describe("#protocol", () => {
			it("should have a forced boolean connected property", () => {
				client({
					init() {
						expect(this.connected).to.be(false);
						this.connected = true;
						expect(this.connected).to.be(true);
						expect(() => this.connected = 1).to.throwError();
						expect(() => this.connected = new Boolean(true)).to.throwError();
						expect(() => this.connected = "true").to.throwError();
						expect(() => this.connected = null).to.throwError();
						expect(() => this.connected = undefined).to.throwError();
					},
					closer() {}
				});
			});

			it("should be (un)observable at the api", () => {
				let l, protocol;
				const changes = [true, false, true, false];
				const api = client({
					init() {
						protocol = this; // eslint-disable-line consistent-this
					},
					closer() {}
				}).route();

				api.observeConnection(l = change => {
					expect(change).to.be(changes.shift());
				});
				protocol.connected = true;
				protocol.connected = true;
				protocol.connected = false;
				api.unobserveConnection(l);
				protocol.connected = true;
				protocol.connected = false;

				expect(() => api.observeConnection()).to.throwError(new TypeError("Protocol connection state observers have to be functions."));
			});
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
			expect(client.isApi(new ClientApi({}))).to.be(true);
			expect(client.isApi(Object.create(new ClientApi({})))).to.be(true);
			expect(client.isApi(Object.create(ClientApi.prototype))).to.be(true);
		});
	});
});
