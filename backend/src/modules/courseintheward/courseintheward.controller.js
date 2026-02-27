const service = require('./courseintheward.service');

// ================= GET COURSE =================
exports.getCourseByRegistry = async (req, res) => {
    try {
        const registryNo = parseInt(req.params.registryNo);

        if (isNaN(registryNo)) {
            return res.status(400).json({ message: 'Invalid Registry Number.' });
        }

        const pool = req.app.locals.pool;

        const result = await service.getCourseByRegistry(pool, registryNo);

        res.json(result);

    } catch (error) {
        console.error('GET Course In Ward Error:', error);
        res.status(500).json({ message: 'Failed to fetch course in ward.' });
    }
};