const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_with_a_strong_secret";
const EXPIRES_IN_SECONDS = 60 * 60 * 24;

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padLength), "base64").toString("utf8");
}

function sign(payloadSegment) {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payloadSegment)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function generateToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + EXPIRES_IN_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  if (encodedSignature !== expectedSignature) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!payload.exp || nowSeconds >= payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}

module.exports = {
  generateToken,
  verifyToken,
};
