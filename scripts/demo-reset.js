// Limit removal to this fixed Compose project's two disposable, labelled volumes.
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
const compose = [
  "compose",
  "--project-name",
  "itt-demo",
  "--env-file",
  ".env.demo",
  "-f",
  "compose.demo.yaml",
];
const volumes = ["database", "evidence"];
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" });
for (const volume of volumes) {
  const [info] = JSON.parse(docker("volume", "inspect", "itt-demo_" + volume));
  if (
    info.Driver !== "local" ||
    Object.keys(info.Options || {}).length ||
    info.Labels?.["com.docker.compose.project"] !== "itt-demo" ||
    info.Labels?.["com.docker.compose.volume"] !== volume ||
    info.Labels?.["mx.itt.demo.disposable"] !== "true"
  )
    throw new Error("El volumen no corresponde a la demostración local.");
}
const prompt = createInterface({ input: stdin, output: stdout });
let answer;
try {
  answer = await prompt.question(
    "Se eliminarán los folios y fotos de la demo. Escribe REINICIAR itt-demo para continuar: ",
  );
} finally {
  prompt.close();
}
if (answer !== "REINICIAR itt-demo") {
  console.log("Operación cancelada.");
} else {
  execFileSync("docker", [...compose, "down"], { stdio: "inherit" });
  for (const name of volumes) docker("volume", "rm", "itt-demo_" + name);
  execFileSync("docker", [...compose, "up", "-d"], { stdio: "inherit" });
}
