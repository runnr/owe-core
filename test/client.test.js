"use strict";

const expect = require("chai").expect;

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
					expect(this.connected).to.equal(false);
					expect(this.init).to.equal(protocol.init);
					expect(this.closer).to.equal(protocol.closer);
					expect(this.a).to.equal(protocol.a);
					expect(this.b).to.equal(protocol.b);
					expect(this.c).to.equal(protocol.c);
				},
				closer() {}
			};
			const api = client(protocol);

			expect(api).to.be.an.instanceof(ClientApi);
		});

		it("should call the init method of the given protocol", () => {
			let x = false;

			client({
				a: 1,
				init() {
					x = true;
					expect(this.a).to.equal(1);
				},
				closer() {}
			});

			expect(x).to.equal(true);
		});

		it("should throw if given an invalid protocol", () => {
			expect(() => client()).to.throw();
			expect(() => client("x")).to.throw();
			expect(() => client(1)).to.throw();
			expect(() => client(undefined)).to.throw();
			expect(() => client(() => undefined)).to.throw();
			expect(() => client(Symbol("test"))).to.throw();
			expect(() => client(true)).to.throw();
			expect(() => client({})).to.throw();
			expect(() => client({
				init: true,
				closer: true
			})).to.throw();
			expect(() => client({
				init() {}
			})).to.throw();
			expect(() => client({
				closer() {}
			})).not.to.throw();
			expect(() => client({
				init: {},
				closer() {}
			})).to.throw();
			expect(() => client({
				init() {},
				closer: {}
			})).to.throw();
		});

		describe("#protocol", () => {
			it("should have a forced boolean connected property", () => {
				client({
					init() {
						expect(this.connected).to.equal(false);
						this.connected = true;
						expect(this.connected).to.equal(true);
						expect(() => this.connected = 1).to.throw();
						expect(() => this.connected = new Boolean(true)).to.throw();
						expect(() => this.connected = "true").to.throw();
						expect(() => this.connected = null).to.throw();
						expect(() => this.connected = undefined).to.throw();
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
					expect(change).to.equal(changes.shift());
				});
				protocol.connected = true;
				protocol.connected = true;
				protocol.connected = false;
				api.unobserveConnection(l);
				protocol.connected = true;
				protocol.connected = false;

				expect(() => api.observeConnection()).to.throw(TypeError, "Protocol connection state observers have to be functions.");
			});
		});
	});

	describe(".isApi()", () => {
		it("should return 'false' for everything that is not an instance of Api", () => {
			expect(client.isApi()).to.equal(false);
			expect(client.isApi(undefined)).to.equal(false);
			expect(client.isApi(null)).to.equal(false);
			expect(client.isApi(123.456)).to.equal(false);
			expect(client.isApi("test")).to.equal(false);
			expect(client.isApi(NaN)).to.equal(false);
			expect(client.isApi(Infinity)).to.equal(false);
			expect(client.isApi({})).to.equal(false);
			expect(client.isApi(() => undefined)).to.equal(false);
			expect(client.isApi(ClientApi)).to.equal(false);
			expect(client.isApi(Object.create(ClientApi))).to.equal(false);
			expect(client.isApi(Symbol("test"))).to.equal(false);
		});

		it("should return 'true' for everything that is an instance of Api", () => {
			expect(client.isApi(new ClientApi({}))).to.equal(true);
			expect(client.isApi(Object.create(new ClientApi({})))).to.equal(true);
			expect(client.isApi(Object.create(ClientApi.prototype))).to.equal(true);
		});
	});
});
