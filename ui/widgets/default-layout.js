import { Header, PageLayout, Text } from "@primer/react";
import Head from "next/head";

export function DefaultLayout({ children, metadata }) {
  return (
    <>
      <Head>
        <title>
          {metadata?.title ? `${metadata.title} • Naceja` : "Naceja"}
        </title>
        {Boolean(metadata?.description) && (
          <meta name="description" content={metadata.description} />
        )}
      </Head>
      <PageLayout padding="none">
        <PageLayout.Header>
          <Header>
            <Header.Item full>
              <Header.Link href="/">Naceja</Header.Link>
            </Header.Item>
            <Header.Item>
              <Header.Link href="/login">Login</Header.Link>
            </Header.Item>
            <Header.Item>
              <Header.Link href="/cadastro">Cadastro</Header.Link>
            </Header.Item>
          </Header>
        </PageLayout.Header>
        <PageLayout.Content padding="normal">{children}</PageLayout.Content>
        <PageLayout.Footer divider="line">
          <Text size="small">© {new Date().getFullYear()} Naceja</Text>
        </PageLayout.Footer>
      </PageLayout>
    </>
  );
}
