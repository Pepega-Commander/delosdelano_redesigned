# Frontend API client

Set `VITE_API_BASE_URL` to the backend **origin**, without `/api` or another path. For local
development, copy `.env.example` to `.env.local`; its value is:

```text
VITE_API_BASE_URL=http://localhost:8081
```

The client adds `/api` once, so `apiClient.post("/auth/login", ...)` calls
`http://localhost:8081/api/auth/login`. Set the same variable to the staging backend origin in the
staging build environment.

Every request declares whether it is public or protected. Public registration and login calls use
`{ auth: "public" }`. Protected calls use `{ auth: "required" }` and read the JWT from the in-memory
token holder. The token is never written to `localStorage` or `sessionStorage`. A page refresh or a
new tab therefore requires another login. Logout clears the in-memory token. Clearing other cached private data during account switching remains a later integration step. The backend does not currently revoke a JWT on logout or a
password change, so an issued token remains valid until its configured expiry.

The client returns parsed JSON, returns `undefined` for HTTP 204, and throws `ApiError` for failures.
`ApiError.status` contains the HTTP status when the server responded. Callers decide how to display
validation errors, handle login 401 responses, or redirect after a protected request fails.
