import { loadLocale, getCode } from "./dist/index.js";

async function test() {
  await loadLocale("es");

  console.log(getCode("Argentina", "es", { type: "alpha3" }));
}

test();
