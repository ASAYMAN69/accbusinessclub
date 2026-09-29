const { corsMiddleware } = require("./middleware/cors.middleware");
const { errorMiddleware, notFound } = require("./middleware/error.middleware");
const { registerHealthRoute } = require("./routes/health.routes");
const { registerRoutes } = require("./routes/registration.routes");

function createApp() {
  const app = require("express")();
  registerHealthRoute(app);
  app.use(corsMiddleware);
  app.use(require("express").json());
  registerRoutes(app);
  app.use(notFound);
  app.use(errorMiddleware);
  return app;
}

module.exports = { createApp };
