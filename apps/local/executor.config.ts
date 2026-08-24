import { defineExecutorConfig } from "@executor-js/sdk";
import { openApiHttpPlugin } from "@executor-js/plugin-openapi/api";
import {
  googleCatalog,
  googleDiscoveryAdapter,
} from "@executor-js/plugin-openapi/providers/google";
import {
  microsoftCatalog,
  microsoftGraphAdapter,
} from "@executor-js/plugin-openapi/providers/microsoft";
import { mcpHttpPlugin } from "@executor-js/plugin-mcp/api";
import { graphqlHttpPlugin } from "@executor-js/plugin-graphql/api";
import { keychainPlugin } from "@executor-js/plugin-keychain";
import { fileSecretsPlugin } from "@executor-js/plugin-file-secrets";
import { onepasswordHttpPlugin } from "@executor-js/plugin-onepassword/api";
import { desktopSettingsPlugin } from "@executor-js/plugin-desktop-settings/server";
import { toolkitsPlugin } from "@executor-js/plugin-toolkits/server";

// ---------------------------------------------------------------------------
// Single source of truth for the local app's plugin list.
//
// Consumed by the host runtime. Executor owns the storage tables; plugins use
// host-provided storage facades instead of contributing schema.
//
// First-party and third-party plugins use the same import-and-call flow.
// ---------------------------------------------------------------------------

interface LocalPluginDeps {
  readonly activeToolkitSlug?: string;
}

// ---------------------------------------------------------------------------
// Secret provider selection — fork patch, not upstreamed.
//
// EXECUTOR_SECRET_PROVIDER chooses where credential values live:
//   - "auto" (default): keychain registers FIRST so it becomes the default
//     store for minted OAuth tokens and pasted values. The keychain plugin
//     self-probes (sentinel write+delete) and registers nothing when the OS
//     keyring is unreachable, so the durable file store becomes first
//     writable = default (see executor.ts defaultWritableProvider).
//   - "file": upstream order — file first, keychain still registered for
//     explicit external refs.
//   - "keychain": strict mode — the file store is omitted entirely, so an
//     unavailable keyring fails loudly instead of silently falling back to
//     plaintext on disk.
//
// Upstream keeps file first because sandbox/headless hosts can expose an
// in-memory keyring that passes the probe but wipes tokens across restarts
// (PR #1478). This fork prefers the OS keychain on persistent machines; auto
// mode cannot distinguish a persistent from an ephemeral keyring.
// ---------------------------------------------------------------------------

type SecretProviderMode = "auto" | "keychain" | "file";

const secretProviderMode = (): SecretProviderMode => {
  const raw = process.env.EXECUTOR_SECRET_PROVIDER?.trim().toLowerCase();
  if (raw === "file" || raw === "keychain") return raw;
  return "auto";
};

// Registration order decides the default store: the first writable credential
// provider wins for minted OAuth tokens and pasted values.
const secretStorePlugins = (mode: SecretProviderMode) =>
  mode === "file"
    ? [fileSecretsPlugin(), keychainPlugin()]
    : mode === "keychain"
      ? [keychainPlugin()]
      : [keychainPlugin(), fileSecretsPlugin()];

export default defineExecutorConfig({
  plugins: ({ activeToolkitSlug }: LocalPluginDeps = {}) => [
    openApiHttpPlugin({
      presets: [...googleCatalog, ...microsoftCatalog],
      specFormats: [googleDiscoveryAdapter, microsoftGraphAdapter],
    }),
    mcpHttpPlugin({ dangerouslyAllowStdioMCP: true }),
    graphqlHttpPlugin(),
    toolkitsPlugin({ activeToolkitSlug }),
    ...secretStorePlugins(secretProviderMode()),
    onepasswordHttpPlugin(),
    desktopSettingsPlugin({
      webBaseUrl:
        process.env.EXECUTOR_WEB_BASE_URL ?? `http://localhost:${process.env.PORT ?? "4788"}`,
    }),
  ],
});
