import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import generateRoutes from "../routes/generateRoutes.js";

function buildServer() {
  const app = express();
  app.use(express.json());
  app.use("/api", generateRoutes);
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message
    });
  });
  return app.listen(0);
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
