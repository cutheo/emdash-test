#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = new URL(".", import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL("manifest.json", root), "utf8"));
const out = new URL("./site/", root);
await fs.mkdir(out, { recursive: true });

function localPath(u) {
  const x = new URL(u);
  const host = x.hostname.replace(/[^a-z0-9.-]/gi, "_");
  let p = x.pathname.replace(/^\//, "").replace(/[^a-z0-9._/-]/gi, "_");
  if (!p || p.endsWith("/")) p += "index";
  if (x.search) p += "__" + Buffer.from(x.search).toString("base64url").slice(0, 18);
  return path.join(host, p);
}

for (const u of manifest.all) {
  try {
    const res = await fetch(u, { redirect: "follow" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const file = path.join(new URL(out).pathname, localPath(u));
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    console.log("OK", u);
  } catch (e) {
    console.error("FAIL", u, String(e));
  }
}

await fs.writeFile(new URL("raw.html", root), await fs.readFile(new URL("raw-source.html", root)));
console.log("Downloaded assets into site/");
