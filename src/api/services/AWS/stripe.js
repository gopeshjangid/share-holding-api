const path = require("path");
var stripe = require("stripe")(
	"sk_test_51KIlSGHiXRuMFQFXXAFM0RV7nqXa9xazvN8sEz6N5oc69FYC4b9ldLp7TK7vha5v0cvQKjXNKxI9Us3RQ9TUQ6c000gpX6qnpH"
);
class stripeClass {
	async createCardToken(params) {
		return new Promise(async (resolve, reject) => {
			try {
				const token = await stripe.tokens
					.create({
						card: {
							number: "4242424242424242",
							exp_month: 6,
							exp_year: 2023,
							cvc: "314",
						},
					})
					.then((response) => resolve(response))
					.catch((err) => reject(err));
			} catch (err) {
				reject(err);
			}
		});
	}

	async createCustomer(params) {
		return new Promise(async (resolve, reject) => {
			try {
				let stripeToken = await this.createCardToken(params);
				stripe.customers
					.create({
						name: params.name,
						email: params.email,
						source: stripeToken.id,
					})
					.then((customer) => resolve(customer))
					.catch((err) => reject(err));
			} catch (err) {
				reject(err);
			}
		});
	}

	async charge(params) {
		return new Promise(async (resolve, reject) => {
			try {
				let customer = await this.createCustomer(params);
				stripe.paymentIntents
					.create({
						amount: params.bookingAmount * 100,
						currency: "usd",
						customer: customer.id,
						payment_method_types: ["card"],
						confirm: true,
						description: "Thank you for your payment.",
					})
					.then((response) => {})
					.catch((err) => {
						reject(err);
					});
			} catch (err) {
				reject(err);
			}
		});
	}

	async createPaymentIntent(params) {
		return new Promise(async (resolve, reject) => {
			try {
				await stripe.paymentIntents
					.create({
						amount: params.amount * 100, // Specify amount here
						currency: "usd", // Specify currency here
					})
					.then((response) => {
						resolve(response);
					})
					.catch((err) => {
						reject(err);
					});
			} catch (err) {
				reject(err);
			}
		});
	}

	async checkout(params) {
		return new Promise(async (resolve, reject) => {
			try {
				// var YOUR_DOMAIN = process.env.URL || "http://localhost:4444/event/paymentdone"
				let domain =
					process.env.NODE_ENV === "production"
						? process.env.URL
						: "https://myvarga.tech/dev";
				var YOUR_DOMAIN = `${domain}/event/${params.eventUrl}`;
				// var YOUR_DOMAIN = `http://localhost:3000/event/${params.eventId}`;
				const product = await stripe.products.create({
					name: params.name || "T-Shirt",
				});
				const price = await stripe.prices.create({
					product: product.id,
					unit_amount: params.amount,
					currency: "cad",
				});

				const session = await stripe.checkout.sessions.create({
					customer_email: params.email,
					line_items: [
						{
							// Provide the exact Price ID (for example, pr_1234) of the product you want to sell
							price: price.id,
							quantity: params.quantity,
						},
					],
					mode: "payment",
					success_url: `${YOUR_DOMAIN}?paymentStatus=SUCCESS`,
					cancel_url: `${YOUR_DOMAIN}?paymentStatus=CANCELLED`,
				});

				resolve(session);
				// res.redirect(303, session.url);
			} catch (er) {
				reject(er);
			}
		});
	}
	async membershipCheckout(params) {
		return new Promise(async (resolve, reject) => {
			try {
				let domain =
					process.env.NODE_ENV === "production"
						? process.env.URL
						: "http://localhost:3000";
				var YOUR_DOMAIN = `${domain}/${params.membershipUrl}`;
				// var YOUR_DOMAIN = `http://localhost:3000/event/${params.eventId}`;
				const product = await stripe.products.create({
					name: params.name || "Club Name",
				});
				const price = await stripe.prices.create({
					product: product.id,
					unit_amount: params.amount,
					currency: "cad",
				});

				const session = await stripe.checkout.sessions.create({
					customer_email: params.email,
					line_items: [
						{
							price: price.id,
							quantity: 1,
						},
					],
					mode: "payment",
					success_url: `${YOUR_DOMAIN}?paymentStatus=SUCCESS`,
					cancel_url: `${YOUR_DOMAIN}?paymentStatus=CANCELLED`,
				});

				resolve(session);
				// res.redirect(303, session.url);
			} catch (er) {
				reject(er);
			}
		});
	}
}

module.exports = stripeClass;
