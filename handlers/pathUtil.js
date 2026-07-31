function badPath(path) {
  if (path.includes("..")) return true;
  if (path.includes("/./")) return true;
  if (path.includes("//")) return true;
  if (path.startsWith(".")) return true;
  return false;
}

module.exports = {badPath};
