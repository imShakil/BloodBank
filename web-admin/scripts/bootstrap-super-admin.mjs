#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
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

function printUsage() {
  console.log(`
Usage:
  npm run bootstrap:super-admin -- --email <EMAIL> [--project-id <ID>] [--role super-admin] [--assigned-by bootstrap]
  npm run bootstrap:super-admin -- --uid <UID> [--project-id <ID>] [--role super-admin] [--assigned-by bootstrap]

Required env:
  VITE_FIREBASE_DATABASE_URL=<https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com>
  VITE_FIREBASE_PROJECT_ID=<YOUR_PROJECT_ID>
  (or FIREBASE_DATABASE_URL)

Auth options (one of):
  FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/service-account.json
  FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
  VITE_FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/service-account.json
  VITE_FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
  Application Default Credentials (ADC)
`);
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

function loadDotEnvFromProjectRoot() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!(key in process.env)) {
      process.env[key] = unquoted;
    }
  }
}

async function main() {
  loadDotEnvFromProjectRoot();

  const args = parseArgs(process.argv.slice(2));
  if (args.help === "true") {
    printUsage();
    process.exit(0);
  }

  const uidArg = args.uid;
  const emailArg = args.email;
  const role = args.role ?? "super-admin";
  const assignedBy = args["assigned-by"] ?? "bootstrap-script";
  const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL ?? process.env.FIREBASE_DATABASE_URL;
  const projectId =
    args["project-id"] ??
    process.env.VITE_FIREBASE_PROJECT_ID ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT;

  if (!databaseURL) {
    console.error("Missing FIREBASE_DATABASE_URL.");
    printUsage();
    process.exit(1);
  }

  if (!projectId) {
    console.error("Missing project ID. Set VITE_FIREBASE_PROJECT_ID or pass --project-id.");
    printUsage();
    process.exit(1);
  }

  if (!uidArg && !emailArg) {
    console.error("Provide --uid or --email.");
    printUsage();
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: resolveCredential(),
      databaseURL,
      projectId
    });
  }

  const auth = getAuth();
  const db = getDatabase();

  let user;
  if (uidArg) {
    user = await auth.getUser(uidArg);
  } else {
    user = await auth.getUserByEmail(emailArg);
  }

  const uid = user.uid;
  const adminRef = db.ref(`admins/${uid}`);
  const snapshot = await adminRef.get();
  const now = Date.now();

  const payload = {
    uid,
    role,
    assignedBy,
    assignedAt: now,
    active: true
  };

  await adminRef.set(payload);

  const action = snapshot.exists() ? "UPDATE_ADMIN_ROLE" : "CREATE_ADMIN_ROLE";
  await db.ref("adminAudit").push({
    action,
    targetUid: uid,
    adminUid: assignedBy,
    details: `Bootstrap super admin role=${role}`,
    timestamp: now
  });

  console.log(`Success: ${user.email ?? uid} is now '${role}'.`);
  console.log(`Path updated: /admins/${uid}`);
}

main().catch((error) => {
  console.error("Bootstrap failed:");
  console.error(error?.stack ?? String(error));
  process.exit(1);
});
