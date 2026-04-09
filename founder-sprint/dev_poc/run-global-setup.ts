import globalSetup from "../e2e/global-setup";

(async () => {
  await globalSetup();
  console.log("global setup refreshed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
