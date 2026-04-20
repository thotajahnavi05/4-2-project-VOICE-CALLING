export const userIdMiddleware = (req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'default';
  next();
};
