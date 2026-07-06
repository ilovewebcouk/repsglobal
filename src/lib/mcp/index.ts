import { auth, defineMcp } from "@lovable.dev/mcp-js";

import echoTool from "./tools/echo";
import getMyProfileTool from "./tools/get-my-profile";
import searchProfessionalsTool from "./tools/search-professionals";

// The OAuth issuer MUST be the direct Supabase host. On publish, SUPABASE_URL
// is rewritten to the `.lovable.cloud` proxy, which mcp-js rejects (RFC 8414
// issuer mismatch). The project ref is the only Supabase value that survives
// publish unchanged. Read it via `import.meta.env.VITE_SUPABASE_PROJECT_ID`,
// which Vite inlines as a literal at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "reps-mcp",
  title: "REPS",
  version: "0.1.0",
  instructions:
    "Tools for the REPS global professional register. `echo` verifies connectivity. `get_my_profile` returns the signed-in member's professional profile. `search_professionals` searches the public directory.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, getMyProfileTool, searchProfessionalsTool],
});
