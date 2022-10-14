const registrationValidation = async (data) => {
	const fields = Object.entries(data)
		.map(([key, value]) => {
			if (key === "gsttin") return false;
			if (key === "website") return false;
			if (key === "isin") return false;
			return !value ? key : false;
		})
		.filter((field) => field);
	return fields;
};

module.exports = {
	registrationValidation,
};
