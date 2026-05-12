import { readFileSync } from "fs";

export interface TlsOptions {
  key: string;
  cert: string;
}

// Self-signed certificate for localhost (valid 100 years).
// Used automatically when HTTPS_KEY_FILE / HTTPS_CERT_FILE are not provided.
// Browsers will show an "untrusted issuer" warning — click Advanced → Proceed.
const LOCALHOST_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDZWqSOd2CLVHED
TSohfTgkYDjsd7s+GCzz4m09+o8BCTL9HvMlmTWwiZGruvA1LVrSrDLIa+yC6XMx
vrT9hlXkb6niQrZox9osvdkyN8+lQfGUuQcOtG2BzwHDDNbqWJTytVZevFimWelO
pN/Hu4X6UM2aePlEXGxb4eb+xp4TXUhH+J9WBgfAj4IT72C+2uKdhD2/gnHwpZJf
PeyERtArBm3RrPrDQWeN0MqjKwIxw5Xfr72qcopfuMoG0kYdlyBlVPxbYfUr57dM
DCjw15fVibaIxsvn4nkluNdoN22YpfvUJTtGvJmqsVHJQ85JqNmNfg/lSceKujrA
eVBMcSnzAgMBAAECggEAdbZ+al3CnpKzxerzh0GOtzyZd498i6uCJO8a5Lce3ZvC
zo0Fd/Zaumo2xz+tuc7/Yhs6QYsZgui1p1o2IRuwxs+mvNAOg/7AbPzAdU7+mOx2
zmnKpa8Xo3ad6Km6dx5URIHq7dGpXSZSkXH/c+deLuu1/hPIQ7qeQMC+Xnrov2kE
uPfpgAU73g/9xTHuUL0O9EdHu/G8oUbSHx9JumVzOsSPtsbi2avHH5WUcc4aARvK
q+Snz3z7yjq8q4W3GvDAve55BQ5AeM2Vn55I+TSuLaFHfhJjAmsJXBZeXQnezQOP
rvuY1ncnPukeAtUNG/Gy4hHEz3pQHbBnC30MqBKmkQKBgQD6VHU5XOniYMQN0p93
U6lXbPeSjO2QnN0TLwDwcv8botJBJiiJSC2IAsB2gAJAaUvTOogaDqexWhK123zn
fivf5Nd2gDMAsC0bfEGUO8No/Hz9kJMrhgX8BIeDbt2HnEAk8VKJ8BTSwQLHi1Op
abTIEcmnLEckzaA6FwiKXgnTWwKBgQDeRvlUY5fCBGsOx0hmUsEV7jZyulIsT3Aa
OcGKYEs4cX/wuQ73NuYU0hxlMUyiXsvRkDFBeL9Vk5OFcVRxHllQ+IPgqteOF3F7
umngR0LLvG0rdDthKhmCfri6hWfOPEGgbSGsSC34n0mZVqX2Ql1eGvTKWDybZWnF
BzRuRkm/SQKBgQDXS75KKKQrA8h6jvSBn12ciGZhD33ei1sD/cAUDQNllGK6j4P7
li06tgsrn6rQFP+W2tdlecc2HF7NM8m4G2bGuD2reFTlOaCB7BtGzyOgbs9dEXPR
0gHhn0+hdb9nu7XbUAYKBocSP9gRIL5CjVxjWhESC13gxE0SyO6aeoh+0wKBgE+T
DROfC+dTeZgy08J+Ac3+F9P+zAg88B8TaixFyOgOCgV92tO5/aiah7vaaFsAoOsH
Ofr8ZVMXoAp3xgkxGjyYm23E+6JM1j27QMgf+tPBQzv5QoDId5V2FGAB/mWgwMXU
C+gHdx24uLqCgKummpJkCBqgeCIRrknxCF4qH6CxAoGBALKC1qxJ2Bt33oN6Nr/x
GBSE265TdOWpKXnldesttQyDSFJtNITDF4sudwGi/SYuBli933S5EwQDubUoJP5P
z2Tw14FROrZACEgUxx6RPeKDb+9Y3vw4eEjM2nvBIWlRD1dHuIYH7z8wPyu/ps2p
6ovaalOeSruj+55Dqx1ddls+
-----END PRIVATE KEY-----`;

const LOCALHOST_CERT = `-----BEGIN CERTIFICATE-----
MIICyzCCAbOgAwIBAgIJAISqvqnGNVNCMA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDAgFw0yNjA0MjMwOTQ1MDNaGA8yMTI2MDMzMDA5NDUwM1ow
FDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA2Vqkjndgi1RxA00qIX04JGA47He7Phgs8+JtPfqPAQky/R7zJZk1sImR
q7rwNS1a0qwyyGvsgulzMb60/YZV5G+p4kK2aMfaLL3ZMjfPpUHxlLkHDrRtgc8B
wwzW6liU8rVWXrxYplnpTqTfx7uF+lDNmnj5RFxsW+Hm/saeE11IR/ifVgYHwI+C
E+9gvtrinYQ9v4Jx8KWSXz3shEbQKwZt0az6w0FnjdDKoysCMcOV36+9qnKKX7jK
BtJGHZcgZVT8W2H1K+e3TAwo8NeX1Ym2iMbL5+J5JbjXaDdtmKX71CU7RryZqrFR
yUPOSajZjX4P5UnHiro6wHlQTHEp8wIDAQABox4wHDAaBgNVHREEEzARgglsb2Nh
bGhvc3SHBH8AAAEwDQYJKoZIhvcNAQELBQADggEBAGRSMpwCvLkOtKFMWvwpBsUz
1oFzy41cY89ZhghEZWmOfwuzKejyJPzByyT1HlV6HkMFRPdN4uWRth9k5HVnGF3U
hlCEGygbshqnFTygV07ztANxh7q7gdmID9bsFDMBlrVNfTfZGqn+nvnqEHlmg5vQ
XN2niyBkAJWHHLLrZ4zC1Xq+4W2Hynov9dd8AlK4Eucur4rzmEoROl6RHcdDnm/q
VxyYP28aFwuZ9RrQARi93kwkmkEpdj+xU8QmLvGNb2h+pC31xJkn4CyfWh5aW1GR
QCN/WByE7p23PEJi0s+V7jxEguojj0W4K0fHwq0c2x5xKxXzzMRv5dsKns0Z89w=
-----END CERTIFICATE-----`;

/**
 * Returns TLS options for the HTTPS server.
 *
 * Priority:
 *   1. HTTPS_KEY_FILE + HTTPS_CERT_FILE env vars (paths to PEM files) — for production
 *   2. Built-in self-signed localhost certificate — for local development
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

  return { key: LOCALHOST_KEY, cert: LOCALHOST_CERT };
}
