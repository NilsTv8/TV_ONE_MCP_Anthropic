import { readFileSync } from "fs";

export interface TlsOptions {
  key: string;
  cert: string;
}

/**
 * Returns TLS options for the HTTPS server.
 *
 * Set HTTPS_KEY_FILE + HTTPS_CERT_FILE to paths of PEM files.
 * Use USE_HTTPS=false to run plain HTTP (e.g. behind ngrok or a reverse proxy).
 */
export function getTlsOptions(): TlsOptions {
  const keyFile = process.env.HTTPS_KEY_FILE;
  const certFile = process.env.HTTPS_CERT_FILE;

  if (keyFile && certFile) {
    return {
      key: readFileSync(keyFile, "utf-8"),
      cert: readFileSync(certFile, "utf-8"),
    };
  }

  console.error(
    "[teamviewer-mcp] FATAL: HTTPS requires HTTPS_KEY_FILE and HTTPS_CERT_FILE to be set.\n" +
    "  For local development behind ngrok or a reverse proxy, set USE_HTTPS=false instead."
  );
  process.exit(1);
}
