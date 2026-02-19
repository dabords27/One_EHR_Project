const authService = require('./auth.service');

const login = async (req, res) => {
  try {
    const result = await authService.login(
      req.app.locals.pool,
      req.body
    );

    res.json(result);
  } catch (err) {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

module.exports = {
  login
};
