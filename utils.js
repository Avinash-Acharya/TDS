// --- Utility Functions ---
// Depends on: gameSeed from state.js, watcherMessages from state.js, watcherMessageUI from dom.js

function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function getRandomWatcherMessage(type) {
  const messages = watcherMessages[type]; // from state.js
  if (!messages || messages.length === 0) return "";
  const typeSeed = gameSeed + type.length; // gameSeed from state.js
  return messages[
    Math.floor(seededRandom(typeSeed * Date.now()) * messages.length)
  ];
}

function displayWatcherMessage(type) {
  watcherMessageUI.textContent = getRandomWatcherMessage(type); // watcherMessageUI from dom.js
}
