import { css } from "@emotion/react";
import { Suspense, lazy, useState } from "react";
import { z } from "zod";

import { Button, Card, Flex, Label, Text } from "@phoenix/components";
import { fieldBaseCSS } from "@phoenix/components/field/styles";
import type { GenerativeProviderKey } from "@phoenix/components/generative/__generated__/ModelMenuQuery.graphql";
import {
  ModelMenu,
  type ModelMenuValue,
} from "@phoenix/components/generative/ModelMenu";

const AgentChat = lazy(() => import("./AgentChat"));

export const AGENT_MODEL_LOCAL_STORAGE_KEY = "arize-phoenix-agent-config";

const generativeProviderKeySchema = z.enum([
  "ANTHROPIC",
  "AWS",
  "AZURE_OPENAI",
  "DEEPSEEK",
  "GOOGLE",
  "OLLAMA",
  "OPENAI",
  "XAI",
]) satisfies z.ZodType<GenerativeProviderKey>;

const agentModelConfigSchema = z.object({
  provider: generativeProviderKeySchema,
  model: z.string(),
  customProviderId: z.string().optional(),
});

export type AgentModelConfig = z.infer<typeof agentModelConfigSchema>;

function toAgentModelConfig(model: ModelMenuValue): AgentModelConfig {
  return {
    provider: model.provider,
    model: model.modelName,
    customProviderId: model.customProvider?.id,
  };
}

function toModelMenuValue(config: AgentModelConfig): ModelMenuValue {
  return {
    provider: config.provider,
    modelName: config.model,
    ...(config.customProviderId && {
      customProvider: { id: config.customProviderId, name: "" },
    }),
  };
}

export function getAgentModelConfigFromLocalStorage(): AgentModelConfig | null {
  try {
    const raw = localStorage.getItem(AGENT_MODEL_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return agentModelConfigSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function SettingsAgentsPage() {
  const [menuValue, setMenuValue] = useState<ModelMenuValue | null>(() => {
    const config = getAgentModelConfigFromLocalStorage();
    return config ? toModelMenuValue(config) : null;
  });

  const chatApiUrl = menuValue
    ? menuValue.customProvider
      ? `/chat?type=custom_provider&provider_id=${encodeURIComponent(menuValue.customProvider.id)}&model_name=${encodeURIComponent(menuValue.modelName)}`
      : `/chat?type=builtin_provider&provider=${encodeURIComponent(menuValue.provider)}&model_name=${encodeURIComponent(menuValue.modelName)}`
    : null;

  const handleChange = (model: ModelMenuValue) => {
    setMenuValue(model);
    localStorage.setItem(
      AGENT_MODEL_LOCAL_STORAGE_KEY,
      JSON.stringify(toAgentModelConfig(model))
    );
  };

  return (
    <Flex direction="column" gap="size-200" width="100%">
      <Card title="Agent Configuration">
        <div
          css={[
            css`
              padding: var(--global-dimension-static-size-200);
            `,
            fieldBaseCSS,
          ]}
        >
          <Label>Provider and Model</Label>
          <Flex direction="row" gap="size-50" alignItems="end">
            <ModelMenu value={menuValue} onChange={handleChange} />
            <Button
              size="S"
              aria-label="Clear provider and model"
              isDisabled={!menuValue}
              onPress={() => {
                setMenuValue(null);
                localStorage.removeItem(AGENT_MODEL_LOCAL_STORAGE_KEY);
              }}
            >
              Clear
            </Button>
          </Flex>
          <Text
            slot="description"
            css={css`
              color: red;
            `}
          >
            The AI provider and model used by the Phoenix agent.
          </Text>
        </div>
      </Card>
      {chatApiUrl && (
        <Suspense>
          <Card title="Agent Chat">
            <AgentChat key={chatApiUrl} chatApiUrl={chatApiUrl} />
          </Card>
        </Suspense>
      )}
    </Flex>
  );
}
