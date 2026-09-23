import { Button, FormControl, Heading, Stack, TextInput } from "@primer/react";
import { useState } from "react";
import { DefaultLayout } from "ui/widgets/default-layout";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    if (res.status === 201) {
      location.href = "/cadastro/confirmar";
      return;
    }
  };

  return (
    <DefaultLayout
      metadata={{
        title: "Cadastro",
        description: "Realize seu cadastro no Naceja.",
      }}
    >
      <Stack className="container-xs">
        <Heading as="h1">Cadastro</Heading>
        <form onSubmit={handleSubmit}>
          <Stack>
            <FormControl>
              <FormControl.Label htmlFor="username">Username</FormControl.Label>
              <TextInput
                type="text"
                id="username"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                block
              />
            </FormControl>
            <FormControl>
              <FormControl.Label htmlFor="email">Email</FormControl.Label>
              <TextInput
                type="text"
                id="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                block
              />
            </FormControl>
            <FormControl>
              <FormControl.Label htmlFor="password">Password</FormControl.Label>
              <TextInput
                id="password"
                type="password"
                placeholder="****"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                block
              />
            </FormControl>
            <Stack.Item>
              <Button variant="primary" type="submit">
                Confirmar
              </Button>
            </Stack.Item>
          </Stack>
        </form>
      </Stack>
    </DefaultLayout>
  );
}
