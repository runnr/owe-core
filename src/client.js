"use strict";

const ClientApi = require("./ClientApi");

function client(protocol) {
	if(!protocol || typeof protocol !== "object")
		throw new TypeError("owe ClientApi protocols have to be objects.");

	if(typeof protocol.closer !== "function")
		throw new TypeError("owe ClientApi proctols have to offer a closer function.");

	if(protocol.init && typeof protocol.init !== "function")
		throw new TypeError("owe ClientApi protocols have to offer an init function.");

	let connected = false;

	protocol = Object.assign({
		get connected() {
			return connected;
		},
		set connected(value) {
			if(typeof value !== "boolean")
				throw new TypeError("Protocol connection state has to be boolean.");

			if(value === connected)
				return;

			connected = value;
			notifier.notify({
				type: "connectedUpdate",
				name: "connected",
				value: connected,
				oldValue: !connected
			});
		}
	}, protocol);

	const notifier = Object.getNotifier(protocol);

	if(protocol.init)
		protocol.init();

	return new ClientApi(protocol);
}

Object.assign(client, {
	isApi(api) {
		return api && typeof api === "object" && api instanceof ClientApi || false;
	}
});

module.exports = client;
