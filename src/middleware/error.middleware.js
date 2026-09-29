const errorMiddleware = (err, req, res, next) => {
  if (err) console.error("Unhandled:", err);
  res.status(400).end();
};

const notFound = (req, res) => res.status(404).end();

module.exports = { errorMiddleware, notFound };
