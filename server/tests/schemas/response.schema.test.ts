import { describe, test, expect } from "bun:test";
import { serializeDesign, serializeDesignSummary, serializeFurnitureItem } from "@/lib/serializers";
import {
  designResponse,
  designSummaryResponse,
  furnitureItemResponse,
  errorResponse,
  successResponse,
  planResponse,
} from "@/schemas/response.schema";

const designRow = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Plan",
  description: null,
  thumbnail: null,
  canvasData: { walls: [], rooms: [{ id: "r1" }], furniture: [{ id: "f1" }] },
  width: 800,
  height: 600,
  userId: "22222222-2222-4222-8222-222222222222",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  yjsState: Buffer.from([1]),
};

const furnitureRow = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Sofa",
  category: "living-room",
  width: 200,
  height: 90,
  depth: 85,
  color: "#9ca3af",
  icon: "sofa",
  description: null,
  isDefault: true,
};

// These are the assertions that keep the OpenAPI document honest: if a
// serializer changes shape, the declared response schema stops matching and
// this fails rather than the docs quietly becoming wrong.
describe("declared responses match what the serializers actually return", () => {
  test("serializeDesign satisfies designResponse", () => {
    const result = designResponse.safeParse(serializeDesign(designRow as never));
    expect(result.success).toBe(true);
  });

  test("serializeDesignSummary satisfies designSummaryResponse", () => {
    const result = designSummaryResponse.safeParse(serializeDesignSummary(designRow as never));
    expect(result.success).toBe(true);
  });

  test("the summary really has no canvasData", () => {
    expect(
      designSummaryResponse.strict().safeParse(serializeDesign(designRow as never)).success,
    ).toBe(false);
  });

  test("serializeFurnitureItem satisfies furnitureItemResponse", () => {
    const result = furnitureItemResponse.safeParse(serializeFurnitureItem(furnitureRow as never));
    expect(result.success).toBe(true);
  });

  test("a response schema rejects the wrong shape", () => {
    expect(designResponse.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    expect(furnitureItemResponse.safeParse({ ...furnitureRow, width: "wide" }).success).toBe(false);
  });
});

describe("shared response shapes", () => {
  test("error responses are always { error: string }", () => {
    expect(errorResponse.safeParse({ error: "Design limit reached" }).success).toBe(true);
    expect(errorResponse.safeParse({ message: "nope" }).success).toBe(false);
  });

  test("success responses are { success: true }", () => {
    expect(successResponse.safeParse({ success: true }).success).toBe(true);
    expect(successResponse.safeParse({ success: false }).success).toBe(false);
  });

  test("planResponse allows a null designLimit for unlimited", () => {
    const pro = {
      plan: "pro",
      canCreateDesign: true,
      canShare: true,
      canUseAI: true,
      designLimit: null,
      designCount: 12,
      status: "active",
      currentPeriodEnd: "2026-03-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    };
    expect(planResponse.safeParse(pro).success).toBe(true);
  });

  test("planResponse tolerates a user who has never paid", () => {
    const free = {
      plan: "free",
      canCreateDesign: true,
      canShare: false,
      canUseAI: false,
      designLimit: 3,
      designCount: 0,
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
    expect(planResponse.safeParse(free).success).toBe(true);
  });
});
