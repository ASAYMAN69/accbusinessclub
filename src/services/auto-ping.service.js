const { AUTO_PING_TARGETS } = require("../config/env");

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;
const REQUEST_TIMEOUT_MS = 10000;

function randomDelayMs() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function fire(url) {
  // Deliberately not awaited: the loop schedules the next hit immediately,
  // so a slow response never delays the following request.
  fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    .then((res) => console.log(`auto-ping ${url} -> ${res.status}`))
    .catch((err) => console.log(`auto-ping ${url} failed: ${err.cause?.code || err.message}`));
}

function startLoop(url) {
  const tick = () => {
    fire(url);
    setTimeout(tick, randomDelayMs());
  };
  tick();
}

function startAutoPing() {
  if (AUTO_PING_TARGETS.length === 0) return;

  const started = [];
  for (const raw of AUTO_PING_TARGETS) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      console.warn(`auto-ping: skipping invalid URL "${raw}"`);
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      console.warn(`auto-ping: skipping non-HTTP(S) URL "${raw}"`);
      continue;
    }
    startLoop(url.href);
    started.push(url.href);
  }

  if (started.length > 0) {
    console.log(`auto-ping: running for ${started.length} target(s) -> ${started.join(", ")}`);
  }
}

module.exports = { startAutoPing };
