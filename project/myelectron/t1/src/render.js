document.addEventListener("DOMContentLoaded", () => {
  try {
    window.expressApi.startServer();
  } catch (e) {
    throw new Error("[express error]", e);
  }
});
