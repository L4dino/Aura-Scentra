export function authErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "Email ou palavra-passe incorrectos. Se acabou de criar conta, confirme o email antes de entrar.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirme o seu email (verifique a caixa de entrada) antes de entrar.";
  }
  if (msg.includes("user already registered")) {
    return "Este email já está registado. Use «Entrar» em vez de criar conta.";
  }
  if (msg.includes("password")) {
    return "A palavra-passe deve ter pelo menos 6 caracteres.";
  }

  return err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.";
}
