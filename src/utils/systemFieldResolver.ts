export const resolveSystemField = (
  fieldConfig: any,
  registryData: any
) => {

  if (fieldConfig.columns) {
    return fieldConfig.columns
      .map((col: string) => registryData[col] ?? "")
      .join(" ")
      .trim();
  }

  if (fieldConfig.column) {
    return registryData[fieldConfig.column];
  }

  return "";
};