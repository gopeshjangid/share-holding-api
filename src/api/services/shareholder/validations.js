const shareholderValidation = async (data) => {
    const fields = Object.entries(data)
        .map(([key, value]) => {
            if (key === 'fathersMiddleName') return false;
            if (key === 'middleName') return false;
            return !value ? key : false;
        })
        .filter((field) => field);
    return fields;
};

module.exports = {
    shareholderValidation
};
