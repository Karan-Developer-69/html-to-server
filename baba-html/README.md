# 🧱 baba-html

> A lightweight backend runtime — write backend APIs using plain HTML files.

`baba-html` lets you define an entire HTTP server using custom HTML tags. No JavaScript boilerplate. Just HTML.

---

## Quick Start

```bash
# 1. Install
git clone <repo> && cd baba-html
npm install
npm link          # makes `baba` available globally

# 2. Create your HTML server file
touch app.html

# 3. Run it
baba app.html
```

---

## Your First API Server

```html
<server port="3000">

  <api path="/hello">
    <response type="json">
      { "message": "Hello World!" }
    </response>
  </api>

  <api method="POST" path="/submit">
    <log message="Form submitted!"/>
    <response type="json">
      { "success": true }
    </response>
  </api>

</server>
```

Run it:
```bash
baba app.html
```

Output:
```
Baba HTML Server Running
Port: 3000
Routes:
  GET  /hello
  POST /submit
Server started. Listening on http://localhost:3000
```

---

## Tag Reference

### `<server>`
The root wrapper tag. All other tags must be placed inside.

| Attribute | Type   | Default | Description          |
|-----------|--------|---------|----------------------|
| `port`    | number | `3000`  | Port to listen on    |

```html
<server port="8080">
  ...
</server>
```

---

### `<api>`
Defines an API route.

| Attribute | Type   | Default | Description                          |
|-----------|--------|---------|--------------------------------------|
| `path`    | string | —       | Route path. Supports Express patterns like `/users/:id` and `*` |
| `method`  | string | `GET`   | HTTP method: `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |

```html
<api method="POST" path="/login">
  ...
</api>
```

---

### `<response>`
Sends a response to the client.

| Attribute | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| `type`    | string | `text`  | `json` or `text`               |

```html
<!-- JSON response -->
<response type="json">
  { "success": true, "data": [1, 2, 3] }
</response>

<!-- Plain text response -->
<response type="text">
  Hello, World!
</response>
```

---

### `<log>`
Prints a message to the server console when the route is called.

| Attribute | Type   | Description          |
|-----------|--------|----------------------|
| `message` | string | Text to log          |

```html
<log message="User hit /dashboard"/>
```

---

### `<delay>`
Adds a pause before sending the response (useful for simulating slow APIs).

| Attribute | Type   | Description                  |
|-----------|--------|------------------------------|
| `ms`      | number | Milliseconds to wait         |

```html
<delay ms="500"/>
```

---

### `<status>`
Sets the HTTP status code of the response.

| Attribute | Type   | Default | Description        |
|-----------|--------|---------|--------------------|
| `code`    | number | `200`   | HTTP status code   |

```html
<status code="404"/>
```

---

### `<static>`
Serves static files from a directory.

| Attribute | Type   | Description                      |
|-----------|--------|----------------------------------|
| `dir`     | string | Directory path (relative to CWD) |

```html
<static dir="public"/>
```
Files in `./public/` are served at `/public/*`.

---

## Full Example

```html
<server port="3000">

  <!-- Serve static assets -->
  <static dir="public"/>

  <!-- GET /hello → JSON -->
  <api path="/hello">
    <log message="Hello endpoint called"/>
    <response type="json">
      { "message": "Hello from Baba HTML" }
    </response>
  </api>

  <!-- POST /login → JSON -->
  <api method="POST" path="/login">
    <log message="Login attempt received"/>
    <response type="json">
      { "success": true }
    </response>
  </api>

  <!-- Slow API with delay -->
  <api path="/slow">
    <delay ms="2000"/>
    <response type="text">This took 2 seconds.</response>
  </api>

  <!-- Custom 404 -->
  <api path="/missing">
    <status code="404"/>
    <response type="json">
      { "error": "Not Found" }
    </response>
  </api>

  <!-- Catch-all wildcard -->
  <api path="*">
    <status code="404"/>
    <response type="json">
      { "error": "Route not found" }
    </response>
  </api>

</server>
```

---

## Config File: `.babarc`

You can set default options by creating a `.babarc` file in your project root (where you run `baba`).

```json
{
  "port": 4000,
  "verbose": true
}
```

| Option    | Type    | Default | Description                              |
|-----------|---------|---------|------------------------------------------|
| `port`    | number  | `3000`  | Default port (overridden by `<server port>`) |
| `verbose` | boolean | `false` | Enables verbose request logging          |

> If both `.babarc` and `<server port="...">` are set, the HTML tag takes priority.

---

## Tag Execution Order

Inside each `<api>`, tags execute **top to bottom**:

1. `<log>` — fires first (so you see logs even before delays)
2. `<delay>` — waits
3. `<status>` — sets status code
4. `<response>` — sends response and ends the handler

---

## Project Structure

```
baba-html/
├── bin/
│   └── baba.js          # CLI entrypoint — run with `baba file.html`
├── runtime/
│   ├── parser.js        # HTML → route config
│   └── router.js        # Starts Express with parsed routes
├── examples/
│   └── app.html         # Example server
├── .babarc              # Optional default config (JSON)
├── package.json
└── README.md
```

---

## CLI Reference

```bash
baba <file.html>
```

| Argument    | Description                          |
|-------------|--------------------------------------|
| `file.html` | Path to your HTML server file        |

---

## License

MIT
