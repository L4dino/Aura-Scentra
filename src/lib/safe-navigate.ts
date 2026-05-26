/** Rotas internas permitidas para redirecionamento após login */
const ALLOWED = [
  "/",
  "/nhoguista",
  "/conta",
  "/catalogo",
  "/favoritos",
  "/carrinho",
  "/admin",
] as const;

export type AppPath = (typeof ALLOWED)[number];

export function sanitizeRedirect(path?: string): AppPath {
  if (path && ALLOWED.includes(path as AppPath)) {
    return path as AppPath;
  }
  return "/";
}
