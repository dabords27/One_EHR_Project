const authService = require('./auth.service');

const login = async (req, res) => {
  try {

    const result = await authService.login(
      req.app.locals.pool,
      req.body
    );

    res.json(result);

  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const verifyUser = async (req, res) => {
  try {

    const result = await authService.verifyUser(
      req.app.locals.pool,
      req.body
    );

    res.json(result);

  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {

    const result = await authService.changePassword(
      req.app.locals.pool,
      req.body
    );

    res.json(result);

  } catch (err) {

    res.status(500).json({
      message: err.message || "Password change failed"
    });

  }
};

module.exports = {
  login,
  verifyUser,
  changePassword
};