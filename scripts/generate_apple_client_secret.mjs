import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Generates an Apple OAuth Client Secret (JWT) for "Sign in with Apple".
 *
 * Required env vars:
 * - APPLE_TEAM_ID:     Your Apple Developer Team ID (iss) (example: RBFLD93SSL)
 * - APPLE_KEY_ID:      The Key ID of the .p8 key (kid) (example: MK664UUF5Y)
 * - APPLE_CLIENT_ID:   Your Service ID (web) or Bundle ID (native) (sub) (example: com.tuorg.dondebailarmx.web)
 * - APPLE_P8_PATH:     Path to the downloaded .p8 file (example: C:\Users\YOU\Downloads\AuthKey_XXXX.p8)
 *
 * Apple client secret JWT requirements:
 * - alg: ES256
 * - aud: https://appleid.apple.com
 * - exp: <= 6 months
 */

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const teamId = requireEnv('APPLE_TEAM_ID').trim();
const keyId = requireEnv('APPLE_KEY_ID').trim();
const clientId = requireEnv('APPLE_CLIENT_ID').trim();
const p8Path = requireEnv('APPLE_P8_PATH').trim();

const absP8 = path.isAbsolute(p8Path) ? p8Path : path.join(process.cwd(), p8Path);
const privateKey = fs.readFileSync(absP8, 'utf8');

const now = Math.floor(Date.now() / 1000);
// Apple: client secret expires max every 6 months. Use 180 days.
const exp = now + 60 * 60 * 24 * 180;

const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
const payload = {
  iss: teamId,
  iat: now,
  exp,
  aud: 'https://appleid.apple.com',
  sub: clientId,
};

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));
const signingInput = `${encodedHeader}.${encodedPayload}`;

// For JWS ES256, signature must be raw (R || S) 64 bytes (ieee-p1363), then base64url.
const signature = crypto.sign('sha256', Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: 'ieee-p1363',
});

const jwt = `${signingInput}.${base64url(signature)}`;

process.stdout.write(jwt + '\n');


