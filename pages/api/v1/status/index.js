import database from "infra/database";

export default function (req, res) {
  switch (req.method) {
    case "GET":
      return GET(req, res);
    default:
      return res.status(405).send();
  }
}

async function GET(req, res) {
  const { version, maxConnections, openedConnections } =
    await catchDatabaseDependencyMetadata();

  const status = {
    updated_at: new Date().toISOString(),
    dependencies: {
      database: {
        postgres_version: version,
        max_connections: maxConnections,
        opened_connections: openedConnections,
      },
    },
  };

  res.status(200).json(status);
}

const catchDatabaseDependencyMetadata = async () => {
  const versionAndMaxConnectionsQueryResult = await database.query({
    text: "SELECT setting FROM pg_settings WHERE name IN ('server_version', 'max_connections') ORDER BY name",
    rowMode: "array",
  });

  const [maxConnections, version] =
    versionAndMaxConnectionsQueryResult.rows.map(([row]) => row);

  const openedConnectionsQueryResult = await database.query({
    text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1",
    values: [process.env.POSTGRES_DB],
    rowMode: "array",
  });

  const [[openedConnections]] = openedConnectionsQueryResult.rows;

  return {
    maxConnections: parseInt(maxConnections),
    openedConnections: parseInt(openedConnections),
    version,
  };
};
