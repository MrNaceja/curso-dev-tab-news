import { useParams } from "next/navigation";
import { DefaultLayout } from "ui/widgets/default-layout";
import { useEffect, useState } from "react";
import { Banner } from "@primer/react";

async function activateUserToken(token) {
  try {
    const res = await fetch(`/api/v1/users/activate/${token}`, {
      method: "PATCH",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return new Error("Erro ao ativar.");
    }
    if (res.status !== 204) {
      return new Error("Erro ao ativar.");
    }
  } catch (e) {
    if (e.name === "TimeoutError") {
      return new Error("Erro ao ativar, servidor não respondeu à tempo.");
    }
    if (e.name === "AbortError") {
      console.error("Deu ruim a request, você interrompeu a request");
      return new Error("Erro ao ativar. Cancelado pelo usuário.");
    }

    return new Error("Erro ao ativar. Falha na conexão.");
  }
}

export default function ActivateUserPage() {
  const params = useParams() ?? {};
  const [activation, setActivation] = useState({
    status: "loading",
    message: undefined,
  });

  useEffect(() => {
    (async () => {
      const result = await activateUserToken(params.token);
      if (result instanceof Error) {
        setActivation((prev) => ({
          ...prev,
          status: "failure",
          message: result.message,
        }));
        return;
      }
      setActivation((prev) => ({ ...prev, status: "success" }));
    })();
  }, [params.token]);

  if (!params) return null;

  return (
    <DefaultLayout
      metadata={{
        description: "Confirmar cadastro",
      }}
    >
      {activation.status === "loading" && (
        <Banner
          aria-label="Ativando..."
          title="Ativando..."
          description="Aguarde, ativando seu cadastro."
          variant="info"
          className="container-xs"
        />
      )}
      {activation.status === "failure" && (
        <Banner
          aria-label="Erro na ativação"
          title="Erro na ativação"
          description={activation.message}
          variant="critical"
          className="container-xs"
        />
      )}
      {activation.status === "success" && (
        <Banner
          aria-label="Sucesso"
          title="Sucesso"
          description="Seu cadastro foi efetuado com sucesso!"
          variant="success"
          className="container-xs"
        />
      )}
    </DefaultLayout>
  );
}
