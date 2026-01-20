function requireFields(body, fields) {
    for (const field of fields) {
        if (!body[field]) {
            return `Field "${field}" is required`;
        }
    }
    return null;
}

function isPositiveNumber(value) {
    return typeof value === 'number' && value > 0;
}

module.exports = {
    requireFields,
    isPositiveNumber
};
