import useSWR from "node_modules/swr/dist/core";

async function fetchApi(endpoint) {
  const response = await fetch(endpoint);
  return await response.json();
}

/**
 * @typedef {{{
 * "updated_at": "2025-12-26T21:17:26.767Z",
 * "dependencies": {
 *   "database": {
 *     "postgres_version": "16.0",
 *     "max_connections": 100,
 *     "opened_connections": 1
 *    }
 * }
 * }}} StatusResponse
 */
function useFetchStatusQuery() {
  return useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 500,
    dedupingInterval: 500,
  });
}

export default function StatusPage() {
  const { data, isLoading } = useFetchStatusQuery();
  const updatedAtHumanReadableFormat = isLoading
    ? ""
    : new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(data.updated_at));

  return (
    <div>
      <h1>Status</h1>

      {isLoading ? (
        <span>Carregando informações...</span>
      ) : (
        <>
          <span>
            <strong>Última atualização</strong> {updatedAtHumanReadableFormat}
          </span>
          <br />
          <br />
          <details>
            <summary>Database</summary>
            <div>
              <span style={{ display: "block" }}>Versão do Postgres:</span>
              <strong>{data?.dependencies?.database?.postgres_version}</strong>
            </div>
            <div>
              <span style={{ display: "block" }}>
                Número máximo de conexões:
              </span>
              <strong>{data?.dependencies?.database?.max_connections}</strong>
            </div>
            <div>
              <span style={{ display: "block" }}>
                Conexões abertas no momento:
              </span>
              <strong>
                {data?.dependencies?.database?.opened_connections}
              </strong>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
