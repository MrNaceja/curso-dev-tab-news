const { exec } = require("node:child_process");

function checkPostgresIsReady() {
  exec(
    "docker exec local-database-postgres pg_isready --host localhost",
    (_, stdout) => {
      if (stdout.includes("accepting connections")) {
        process.stdout.write("\n ✅ Serviço postgres está pronto \n");
        return;
      }

      process.stdout.write(".");
      checkPostgresIsReady();
    },
  );
}

process.stdout.write("\n ⛔ Aguardando serviço postgres");
checkPostgresIsReady();
