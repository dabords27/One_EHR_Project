const service = require('./admissions.service');

exports.getAdmissions = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const data = await service.getAdmissions(pool, req.query);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveCount = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const count = await service.getActiveInpatientCount(pool);

    res.json({ count });
  } catch (error) {
    console.error('Active count error:', error);
    res.status(500).json({ message: 'Failed to fetch active count' });
  }
};