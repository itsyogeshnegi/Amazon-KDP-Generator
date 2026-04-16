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
  assert.match(body.interiorFileUrl, /^\/api\/downloads\/.+\.pdf$/);
  assert.match(body.interiorFileName, /^.+\.pdf$/);
  assert.match(body.coverFileUrl, /^\/api\/downloads\/.+\.pdf$/);
  assert.match(body.coverFileName, /^.+\.pdf$/);

  const interiorResponse = await fetch(`http://127.0.0.1:${port}${body.interiorFileUrl}`);
  assert.equal(interiorResponse.status, 200);
  assert.equal(interiorResponse.headers.get("content-type"), "application/pdf");
  await interiorResponse.arrayBuffer();

  const coverResponse = await fetch(`http://127.0.0.1:${port}${body.coverFileUrl}`);
  assert.equal(coverResponse.status, 200);
  assert.equal(coverResponse.headers.get("content-type"), "application/pdf");
  await coverResponse.arrayBuffer();
  await closeServer(server);
});

test("swagger docs route loads", async () => {
  const server = buildServer();
  const port = server.address().port;

  const homeResponse = await fetch(`http://127.0.0.1:${port}/`, {
    redirect: "manual"
  });
  assert.equal(homeResponse.status, 302);
  assert.equal(homeResponse.headers.get("location"), "/api/docs/");

  const redirectResponse = await fetch(`http://127.0.0.1:${port}/api/docs`, {
    redirect: "manual"
  });
  assert.equal(redirectResponse.status, 302);
  assert.equal(redirectResponse.headers.get("location"), "/api/docs/");

  const response = await fetch(`http://127.0.0.1:${port}/api/docs/`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /swagger-ui/i);
  assert.match(body, /Amazon KDP Generator API Docs/i);
  assert.match(body, /\/api\/docs\.json/i);
  await closeServer(server);
});

test("swagger json route returns the spec", async () => {
  const server = buildServer();
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/docs.json`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.openapi, "3.0.3");
  assert.equal(body.info.title, "Amazon KDP Generator API");
  assert.equal(body.servers[0].url, "https://amazon-kdp-generator.onrender.com");
  await closeServer(server);
});
