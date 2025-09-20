import { UmbrellaRoute } from "./types";

export function attemptScrollToTop(
  route: UmbrellaRoute
) {
  if (
    route.action === "push" &&
    typeof window === "object" &&
    window !== null &&
    typeof window.scroll === "function" &&
    typeof navigator === "object" &&
    navigator !== null &&
    typeof navigator.userAgent === "string" &&
    !(
      navigator.userAgent.indexOf("Node.js") > 0 ||
      navigator.userAgent.indexOf("jsdom") > 0
    )
  ) {
    try {
      window.scroll(0, 0);
    } catch {}
  }
}
