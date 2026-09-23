import { Banner } from "@primer/react";
import { DefaultLayout } from "ui/widgets/default-layout";

export default function ConfirmRegisterPage() {
  return (
    <DefaultLayout
      metadata={{
        description: "Confirmação de cadastro.",
      }}
    >
      <Banner
        aria-label="Continuar cadastro"
        title="Continuar cadastro"
        description="Acesse a caixa de entrada do seu email para continuar com o cadastro."
        variant="warning"
        className="container-xs"
      />
    </DefaultLayout>
  );
}
