import { Banner, Heading, Spinner, Stack } from "@primer/react";
import { Card } from "@primer/react/experimental";
import useSWR from "swr";
import { DefaultLayout } from "ui/widgets/default-layout";

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

  const database = data?.dependencies?.database;

  return (
    <DefaultLayout
      metadata={{
        title: "Status",
        description: "Status do sistema.",
      }}
    >
      <Stack>
        <Heading as="h1">Status</Heading>

        {isLoading ? (
          <Spinner />
        ) : (
          <Stack>
            <Banner variant="info" layout="compact">
              <Banner.Title>Última atualização</Banner.Title>
              <Banner.Description>
                {updatedAtHumanReadableFormat}
              </Banner.Description>
            </Banner>

            <Heading as="h2" variant="medium">
              Database
            </Heading>
            <Stack direction={{ narrow: "vertical", regular: "horizontal" }}>
              <Stack.Item grow>
                <Card>
                  <Card.Heading>PostgresSQL</Card.Heading>
                  <Card.Description>
                    {database?.version ?? "-"}
                  </Card.Description>
                  <Card.Metadata>Versão atual em execução.</Card.Metadata>
                </Card>
              </Stack.Item>
              <Stack.Item grow>
                <Card>
                  <Card.Heading>Conexões abertas</Card.Heading>
                  <Card.Description>
                    {database?.opened_connections}
                  </Card.Description>
                  <Card.Metadata>Abertas no momento.</Card.Metadata>
                </Card>
              </Stack.Item>
              <Stack.Item grow>
                <Card>
                  <Card.Heading>Máximo conexões</Card.Heading>
                  <Card.Description>
                    {database?.max_connections}
                  </Card.Description>
                  <Card.Metadata>Número máximo de conexões.</Card.Metadata>
                </Card>
              </Stack.Item>
            </Stack>
          </Stack>
        )}
      </Stack>
    </DefaultLayout>
  );
}
