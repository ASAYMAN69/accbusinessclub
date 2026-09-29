const { corsMiddleware } = require("./middleware/cors.middleware");
const { errorMiddleware, notFound } = require("./middleware/error.middleware");
const { registerRoutes } = require("./routes/registration.routes");

function createApp() {
  const app = require("express")();
  app.use(corsMiddleware);
  app.use(require("express").json());
  registerRoutes(app);
  app.use(notFound);
  app.use(errorMiddleware);
  return app;
}

module.exports = { createApp };
