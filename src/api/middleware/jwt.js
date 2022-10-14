const jwt = require("jsonwebtoken");
const config = require("../../config/config");

class jwtToken {
	verifyToken = (req, res, next) => {
		const token =
			req?.body?.token || req?.query?.token || req?.headers["x-access-token"];
		if (!token) {
			return res
				.status(403)
				.send({
					data: null,
					status: false,
					message: "A token is required for authentication",
				});
		}
		try {
			const decoded = jwt.verify(token, config?.jwtSecret);
			req.user = decoded;
		} catch (err) {
			return res
				.status(401)
				.send({ data: null, status: false, message: "Invalid Token" });
		}
		return next();
	};

	isAdmin = (req, res, next) => {
		const token =
			req?.body?.token || req?.query?.token || req?.headers["x-access-token"];
		if (!token) {
			return res
				.status(403)
				.send({
					data: null,
					status: false,
					message: "A token is required for authentication",
				});
		}
		try {
			const decoded = jwt.verify(token, config?.jwtSecret);
			req.user = decoded;
			if (decoded?.userType == "admin") {
			} else {
				return res
					.status(401)
					.send({
						data: null,
						status: false,
						message: "Only admin accessible",
					});
			}
		} catch (err) {
			return res
				.status(401)
				.send({ data: null, status: false, message: "Invalid Token" });
		}
		return next();
	};

	isClub = (req, res, next) => {
		const token =
			req?.body?.token || req?.query?.token || req?.headers["x-access-token"];
		if (!token) {
			return res
				.status(403)
				.send({
					data: null,
					status: false,
					message: "A token is required for authentication",
				});
		}
		try {
			const decoded = jwt.verify(token, config?.jwtSecret);
			req.user = decoded;
			if (decoded?.userType == "club") {
			} else {
				return res
					.status(401)
					.send({ data: null, status: false, message: "Only club accessible" });
			}
		} catch (err) {
			return res
				.status(401)
				.send({ data: null, status: false, message: "Invalid Token" });
		}
		return next();
	};

	isStudent = (req, res, next) => {
		const token =
			req?.body?.token || req?.query?.token || req?.headers["x-access-token"];
		if (!token) {
			return res
				.status(403)
				.send({
					data: null,
					status: false,
					message: "A token is required for authentication",
				});
		}
		try {
			const decoded = jwt.verify(token, config?.jwtSecret);
			req.user = decoded;
			if (decoded?.userType === "user") {
			} else {
				return res
					.status(401)
					.send({
						data: null,
						status: false,
						message: "Only Student accessible",
					});
			}
		} catch (err) {
			return res
				.status(401)
				.send({ data: null, status: false, message: "Invalid Token" });
		}
		return next();
	};

	decodedToken = (req, res) => {
		const token =
			req?.body?.token || req?.query?.token || req?.headers["x-access-token"];
		if (!token) {
			return res
				.status(403)
				.send({
					data: null,
					status: false,
					message: "A token is required for authentication",
				});
		}
		try {
			const decoded = jwt.verify(token, config?.jwtSecret);
			return decoded;
		} catch (err) {
			return res
				.status(401)
				.send({ data: null, status: false, message: "Invalid Token" });
		}
	};

	createToken = (_id, email, name) => {
		const token = jwt.sign({ _id, name, email }, config?.jwtSecret, {
			expiresIn: "1h",
		});
		return token;
	};
}

module.exports = jwtToken;
