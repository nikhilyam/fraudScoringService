import Joi from 'joi';

const payloadSchema = Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).required(),
    ip: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).required(),
    deviceFingerprint: Joi.string().required(),
    email: Joi.string().email().required()
});

export const validatePayload = (payload) => payloadSchema.validate(payload);