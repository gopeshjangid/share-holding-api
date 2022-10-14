const logger = require('../../logger');
/**
 *@description This middleware return a function which will validate
 * the incoming request payload against a Joi Schema.
 * If invalidated it will return from here only
 * otherwise it will pass on the request to next Handlers
 *
 * @param joiSchema The schema against which request needs to be validated
 * @method validateRequest
 */
function validateRequest(joiSchema) {
    return async (req, res, next) => {
        logger.debug(' request params => ', req.params);
        logger.debug(' request body => ', req.body);
        logger.debug(' request query => ', req.query);
        try {
            for (let query of Object.keys(req.query)) {
                req.query[query] = decodeURIComponent(req.query[query].toString());
            }
            for (let param of Object.keys(req.params)) {
                req.params[param] = decodeURIComponent(req.params[param]);
            }
            const requestPayload = {
                ...req.body,
                ...req.params,
                ...req.query
            };
            logger.log(requestPayload);
            const result = await joiSchema.validateAsync(requestPayload);
            req['data'] = result;
            next();
        } catch (err) {
            logger.error(err.message);
            return res.status(422).json({
                _status: 422,
                success: false,
                message: err.message
            });
        }
    };
}

module.exports = validateRequest;
