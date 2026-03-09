#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[key] = value;
  }
  return args;
}

function loadDotEnvFromProjectRoot() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function resolveCredential() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? process.env.VITE_FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return cert(JSON.parse(json));
  }
  const credentialPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? process.env.VITE_FIREBASE_SERVICE_ACCOUNT_PATH;
  if (credentialPath) {
    const raw = fs.readFileSync(credentialPath, "utf-8");
    return cert(JSON.parse(raw));
  }
  return applicationDefault();
}

async function main() {
  loadDotEnvFromProjectRoot();
  const args = parseArgs(process.argv.slice(2));
  const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL ?? process.env.FIREBASE_DATABASE_URL;
  const projectId =
    args["project-id"] ??
    process.env.VITE_FIREBASE_PROJECT_ID ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT;

  if (!databaseURL || !projectId) {
    throw new Error("Missing VITE_FIREBASE_DATABASE_URL or VITE_FIREBASE_PROJECT_ID.");
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: resolveCredential(),
      databaseURL,
      projectId
    });
  }

  const db = getDatabase();
  const now = Date.now();

  const [usersSnap, postsSnap, presenceSnap] = await Promise.all([
    db.ref("users").get(),
    db.ref("posts").get(),
    db.ref("presence").get()
  ]);
  const usersObj = usersSnap.exists() ? usersSnap.val() : {};
  const postsObj = postsSnap.exists() ? postsSnap.val() : {};
  const presenceObj = presenceSnap.exists() ? presenceSnap.val() : {};

  const posts = Object.entries(postsObj).map(([id, raw]) => {
    const row = asObject(raw);
    return {
      id,
      name: asString(row.Name) ?? "Unknown",
      bloodGroup: asString(row.BloodGroup) ?? "N/A",
      authorUid: asString(row.authorUid) ?? "",
      time: asNumber(row.Time) ?? 0
    };
  });

  const activeNow = Object.values(presenceObj).filter((raw) => {
    const row = asObject(raw);
    return row.online === true;
  }).length;

  const recentPosts = posts
    .sort((a, b) => b.time - a.time)
    .slice(0, 8)
    .map((post) => ({
      id: post.id,
      name: post.name,
      bloodGroup: post.bloodGroup
    }));

  const donors = Object.entries(usersObj).map(([uid, raw]) => {
    const row = asObject(raw);
    return {
      uid,
      name: asString(row.Name ?? row.name) ?? "Unknown donor",
      district: asString(row.District ?? row.district) ?? "Unknown district",
      joinedAt:
        asNumber(row.joinedAt) ??
        asNumber(row.createdAt) ??
        asNumber(row.registeredAt) ??
        asNumber(row.Time) ??
        0
    };
  });

  const newDonors = donors
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, 8)
    .map((donor) => ({
      uid: donor.uid,
      name: donor.name,
      district: donor.district
    }));

  await db.ref("publicLanding").set({
    totalUsers: Object.keys(usersObj).length,
    totalPosts: Object.keys(postsObj).length,
    activeNow,
    recentPosts,
    newDonors,
    updatedAt: now
  });

  console.log("publicLanding snapshot published.");
}

function asString(value) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value) {
  return typeof value === "number" ? value : undefined;
}

function asObject(value) {
  return typeof value === "object" && value ? value : {};
}

async function shutdownFirebase() {
  const apps = getApps();
  await Promise.all(
    apps.map((app) =>
      app.delete().catch(() => {
        return undefined;
      })
    )
  );
}

main()
  .then(async () => {
    await shutdownFirebase();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Publish failed:");
    console.error(error?.stack ?? String(error));
    await shutdownFirebase();
    process.exit(1);
  });
