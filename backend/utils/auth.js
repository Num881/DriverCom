function requireRole (role) {
    return async function (request, reply) {
        if (!request.user) {
            return reply.code(401).send({error: 'Unauthorized'});
        }

        if (request.user.role !== role) {
            return reply.code(403).send({error: 'Forbidden'});
        }
    };
}

module.exports = {
    requireRole
}