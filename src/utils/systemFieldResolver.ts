export const resolveSystemField = (
  fieldConfig: any,
  registryData: any
) => {
  if (!registryData) return "";
  
  if (found.format === "date" && value) {
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
}

  if (fieldConfig.columns) {
    return fieldConfig.columns
      .map((col: string) => registryData[col] ?? "")
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  if (fieldConfig.column) {
    return registryData[fieldConfig.column] ?? "";
  }

  return "";
};