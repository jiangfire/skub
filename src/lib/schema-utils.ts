// ─── JSON Schema Utilities ───
// Convert JSON Schema to form fields and OpenAPI snippets.
// Pure functions, fully testable (KISS).

export interface FormField {
  name: string;
  label: string;
  type: "string" | "number" | "integer" | "boolean" | "object" | "array";
  required: boolean;
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: FormField; // for array type
  properties?: FormField[]; // for object type
}

/**
 * Convert a JSON Schema object to a list of form fields.
 * Handles top-level object schema with properties.
 */
export function schemaToFormFields(schema: Record<string, unknown>): FormField[] {
  const type = schema.type as string | undefined;
  if (type !== "object" && !schema.properties) {
    // Non-object schema: wrap as single field
    return [
      {
        name: "input",
        label: "input",
        type: (type as FormField["type"]) ?? "string",
        required: true,
        description: schema.description as string | undefined,
        default: schema.default,
        enum: schema.enum as string[] | undefined,
      },
    ];
  }

  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const requiredList = (schema.required ?? []) as string[];

  return Object.entries(properties).map(([key, prop]) => ({
    name: key,
    label: key,
    type: (prop.type as FormField["type"]) ?? "string",
    required: requiredList.includes(key),
    description: prop.description as string | undefined,
    default: prop.default,
    enum: prop.enum as string[] | undefined,
    items: prop.items
      ? schemaToFormField(prop.items as Record<string, unknown>, "item")
      : undefined,
  }));
}

function schemaToFormField(schema: Record<string, unknown>, name: string): FormField {
  return {
    name,
    label: name,
    type: (schema.type as FormField["type"]) ?? "string",
    required: true,
    description: schema.description as string | undefined,
    default: schema.default,
    enum: schema.enum as string[] | undefined,
  };
}

/**
 * Generate a cURL example from a JSON Schema and invoke URL.
 */
export function generateCurlExample(
  invokeUrl: string,
  inputSchema: Record<string, unknown>,
): string {
  const sampleInput = generateSampleValue(inputSchema);
  const jsonStr = JSON.stringify(sampleInput, null, 2);
  return `curl -X POST ${invokeUrl} \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '${jsonStr}'`;
}

/**
 * Generate sample value from JSON Schema.
 */
export function generateSampleValue(schema: Record<string, unknown>): unknown {
  const type = schema.type as string | undefined;

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  switch (type) {
    case "string":
      return (schema.enum as string[] | undefined)?.[0] ?? "string";
    case "number":
      return 0;
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      return items ? [generateSampleValue(items)] : [];
    }
    case "object": {
      const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const result: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(properties)) {
        result[key] = generateSampleValue(prop);
      }
      return result;
    }
    default:
      return null;
  }
}

/**
 * Generate an OpenAPI 3.0 snippet from a skill's schemas.
 */
export function generateOpenApiSnippet(params: {
  slug: string;
  name: string;
  summary: string;
  invokeUrl: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}): Record<string, unknown> {
  const { slug, name, summary, invokeUrl, inputSchema, outputSchema } = params;

  return {
    openapi: "3.0.3",
    info: {
      title: name,
      version: "1.0.0",
      description: summary,
    },
    paths: {
      [invokeUrl]: {
        post: {
          operationId: `invoke_${slug.replace(/-/g, "_")}`,
          summary: `Invoke ${name}`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: inputSchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: outputSchema,
                },
              },
            },
            "401": {
              description: "Unauthorized — invalid or missing API key",
            },
            "429": {
              description: "Rate limit exceeded (60 requests/minute/key)",
            },
            "500": {
              description: "Internal server error or skill execution failure",
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Use your API key as the bearer token",
        },
      },
    },
  };
}
