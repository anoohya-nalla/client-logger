export const formatPathLabel = (rawPath = "") => {
  const path = rawPath.replace(/^https?:\/\/[^/]+/, "").split("?")[0] || "/";
  if (path === "/") return "Home";
  if (path.startsWith("/api")) return "API: " + path;
  if (path === "") return "Root";
  return path;
};
