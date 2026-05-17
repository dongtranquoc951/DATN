const stripCommentsAndStrings = (code) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, "");

const REQUIREMENT_RULES = [
  {
    names: ["if", "condition", "nested", "else_if", "multi_branch", "two_branches"],
    label: "if",
    pattern: /\bif\s*\(/,
  },
  {
    names: ["else", "else_if", "multi_branch", "two_branches"],
    label: "else",
    pattern: /\belse\b/,
  },
  {
    names: ["while"],
    label: "while",
    pattern: /\bwhile\s*\(/,
  },
  {
    names: ["for"],
    label: "for",
    pattern: /\bfor\s*\(/,
  },
];

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

export const getLevelRequirements = (levelData, gridConfig) => {
  const concepts = normalizeList(gridConfig?.concepts ?? levelData?.concepts);
  const explicit = normalizeList(gridConfig?.required_commands ?? gridConfig?.requiredCommands ?? levelData?.required_commands);
  return [...new Set([...concepts, ...explicit])];
};

export const validateRequiredConcepts = (code, requirements) => {
  const cleanedCode = stripCommentsAndStrings(code);
  const missing = REQUIREMENT_RULES
    .filter((rule) => rule.names.some((name) => requirements.includes(name)))
    .filter((rule, index, rules) => rules.findIndex((r) => r.label === rule.label) === index)
    .filter((rule) => !rule.pattern.test(cleanedCode))
    .map((rule) => rule.label);

  if (missing.length === 0) return { valid: true, missing };

  return {
    valid: false,
    missing,
    message: `Level này yêu cầu dùng cấu trúc: ${missing.join(", ")}. Hãy dùng đúng kiến thức của bài thay vì chỉ viết các lệnh di chuyển liên tiếp.`,
  };
};
