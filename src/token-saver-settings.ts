export interface TokenSaverOptions {
  rtk: {
    enabled: boolean;
    compressGitDiff: boolean;
    compressGrep: boolean;
    compressLsTree: boolean;
    dedupThresholdBytes: number; // default: 4096
  };
  caveman: {
    enabled: boolean;
    level: "subtle" | "moderate" | "aggressive"; // subtle: -20%, moderate: -40%, aggressive: -65% output tokens
    preserveTechnicalIdentifiers: boolean;
    terseBulletMode: boolean;
  };
  ponytail: {
    enabled: boolean;
    level: "lite" | "full" | "ultra"; // lazy senior dev mode: YAGNI-first
    strictMinimalRefactor: boolean;
  };
}

export const defaultTokenSaverConfig: TokenSaverOptions = {
  rtk: {
    enabled: true,
    compressGitDiff: true,
    compressGrep: true,
    compressLsTree: true,
    dedupThresholdBytes: 4096
  },
  caveman: {
    enabled: false,
    level: "moderate",
    preserveTechnicalIdentifiers: true,
    terseBulletMode: true
  },
  ponytail: {
    enabled: true,
    level: "full",
    strictMinimalRefactor: true
  }
};

/**
 * Builds the effective prompt injection for Caveman & Ponytail
 */
export function buildTokenSaverPromptInstructions(config: TokenSaverOptions): string {
  const instructions: string[] = [];

  if (config.ponytail.enabled) {
    instructions.push(
      `[PONYTAIL MODE - ${config.ponytail.level.toUpperCase()}]: Write the smallest, most minimal change that fully solves the task. Avoid premature abstraction, unnecessary boilerplate, or speculative features (YAGNI).`
    );
  }

  if (config.caveman.enabled) {
    instructions.push(
      `[CAVEMAN MODE - ${config.caveman.level.toUpperCase()}]: Be terse and concise. Drop filler phrases, conversational padding, and redundant intros. Keep exact technical substance, code blocks, and identifiers intact.`
    );
  }

  return instructions.join("\n\n");
}
