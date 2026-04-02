import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Amazon KDP Generator API",
    version: "1.0.0",
    description: "API for generating puzzle previews, exporting puzzle-book PDFs, and downloading generated files."
  },
  servers: [
    {
      url: "https://amazon-kdp-generator.onrender.com",
      description: "Render production"
    }
  ],
  components: {
    schemas: {
      GenerateRequest: {
        type: "object",
        required: ["type", "difficulty", "count"],
        properties: {
          type: {
            type: "string",
            enum: ["sudoku", "maze", "crossword", "wordsearch", "tictactoe"]
          },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"]
          },
          count: {
            type: "integer",
            minimum: 1,
            maximum: 100
          },
          layout: {
            oneOf: [
              {
                type: "integer",
                enum: [1, 2, 4]
              },
              {
                type: "object",
                properties: {
                  puzzlesPerPage: {
                    type: "integer",
                    enum: [1, 2, 4]
                  }
                }
              }
            ]
          },
          theme: {
            type: "string",
            example: "tech"
          },
          bookSize: {
            type: "string",
            enum: ["8.5x11", "8x10", "6x9"],
            example: "8.5x11"
          },
          includeCoverPage: {
            type: "boolean"
          }
        }
      },
      PreviewPuzzle: {
        type: "object",
        properties: {
          id: { type: "string" },
          number: { type: "integer" },
          type: { type: "string" },
          difficulty: { type: "string" },
          puzzle: { type: "object", additionalProperties: true },
          solution: { type: "object", additionalProperties: true },
          meta: { type: "object", additionalProperties: true }
        }
      },
      PreviewResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          preview: {
            type: "array",
            items: {
              $ref: "#/components/schemas/PreviewPuzzle"
            }
          }
        }
      },
      GenerateResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          fileUrl: { type: "string", example: "/api/downloads/puzzle-book-demo.pdf" },
          fileName: { type: "string", example: "puzzle-book-demo.pdf" },
          manifestId: { type: "string" },
          totalPuzzles: { type: "integer" }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" }
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        responses: {
          200: {
            description: "Service status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/generate/preview": {
      post: {
        summary: "Generate preview puzzles",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GenerateRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Preview generated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PreviewResponse"
                }
              }
            }
          },
          400: {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/generate": {
      post: {
        summary: "Generate puzzle book PDF",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GenerateRequest"
              }
            }
          }
        },
        responses: {
          200: {
            description: "Puzzle book created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/GenerateResponse"
                }
              }
            }
          },
          400: {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/downloads/{fileName}": {
      get: {
        summary: "Download generated PDF",
        parameters: [
          {
            name: "fileName",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          200: {
            description: "PDF file stream"
          }
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: []
});
