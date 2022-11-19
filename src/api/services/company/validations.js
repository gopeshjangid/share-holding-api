const registrationValidation = async (data) => {
    const fields = Object.entries(data)
        .map(([key, value]) => {
            if (key === 'gsttin') return false;
            if (key === 'website') return false;
            if (key === 'isin') return false;
            if (key === 'status') return false;
            if (key === 'correspondence_address') return false;
            if (key === 'gst') {
                return false;
            } else {
                return !value ? key : false;
            }
        })
        .filter((field) => field);
    return fields;
};

module.exports = {
    registrationValidation
};
