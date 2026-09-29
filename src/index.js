const { PORT } = require("./config/env");
const { createApp } = require("./app");
const { startAutoPing } = require("./services/auto-ping.service");

const app = createApp();
app.listen(PORT, () => {
  console.log(`Registration server listening on port ${PORT}`);
  startAutoPing();
});
