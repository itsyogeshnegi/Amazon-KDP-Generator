import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server.js";

function buildServer() {
  return createApp().listen(0);
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

test("preview endpoint returns 1-2 generated puzzles", async () => {
  const server = buildServer();
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/generate/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "sudoku",
      difficulty: "easy",
      count: 12,
      layout: 1
    })
  });

  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.preview.length <= 2);
  await closeServer(server);
});

test("generate endpoint validates count range", async () => {
  const server = buildServer();
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "maze",
      difficulty: "easy",
      count: 101,
      layout: 1
    })
  });

  assert.equal(response.status, 400);
  await closeServer(server);
});

test("generate endpoint creates a PDF and download route serves it", async () => {
  const server = buildServer();
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "maze",
      difficulty: "medium",
      count: 2,
      layout: 1,
      includeCoverPage: true
    })
  });

  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.match(body.fileUrl, /^\/api\/downloads\/.+\.pdf$/);

  const fileResponse = await fetch(`http://127.0.0.1:${port}${body.fileUrl}`);
  assert.equal(fileResponse.status, 200);
  assert.equal(fileResponse.headers.get("content-type"), "application/pdf");
  await fileResponse.arrayBuffer();
  await closeServer(server);
});

test("swagger docs route loads", async () => {
  const server = buildServer();
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/docs/`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /swagger-ui/i);
  assert.match(body, /Amazon KDP Generator API/i);
  await closeServer(server);
});
