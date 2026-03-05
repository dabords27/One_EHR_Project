export const resolveSystemField = (fieldConfig, registryData) => {
  if (!registryData) return "";

  let value = "";

  if (fieldConfig.columns) {
    value = fieldConfig.columns
      .map((col) => registryData[col] ?? "")
      .filter(Boolean)
      .join(" ")
      .trim();
  } else if (fieldConfig.column) {
    value = registryData[fieldConfig.column] ?? "";
  }

  if (fieldConfig.format === "date" && value) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  return value;
};