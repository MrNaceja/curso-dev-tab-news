import "@primer/primitives/dist/css/functional/themes/light.css";
import { BaseStyles, ThemeProvider } from "@primer/react";

export default function App({ Component: Page, pageProps }) {
  return (
    <ThemeProvider>
      <BaseStyles>
        <Page {...pageProps} />
      </BaseStyles>
    </ThemeProvider>
  );
}
