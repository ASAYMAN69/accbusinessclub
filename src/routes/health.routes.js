// Registered BEFORE the CORS middleware so the response carries no
// Access-Control-* headers and no preflight handling — plain GET only.
function registerHealthRoute(app) {
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
}

module.exports = { registerHealthRoute };
