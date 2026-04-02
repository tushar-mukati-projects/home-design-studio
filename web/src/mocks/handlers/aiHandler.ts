import { http, HttpResponse, delay } from "msw";
import { _furnitureItems } from "../store";
import { mockUrl } from "../config";

const ROOM_SUGGESTIONS: Record<string, string[]> = {
  "living-room": ["Sofa", "Coffee Table", "Armchair", "TV Stand", "Floor Lamp", "Bookshelf"],
  bedroom: ["Double Bed", "Nightstand", "Wardrobe", "Dresser", "Desk"],
  kitchen: ["Dining Table", "Dining Chair", "Dining Chair", "Refrigerator", "Stove"],
  bathroom: ["Bathtub", "Toilet", "Sink"],
  office: ["Office Desk", "Office Chair", "Bookcase", "Filing Cabinet"],
  generic: ["Sofa", "Coffee Table", "Desk"],
};

export const aiHandlers = [
  http.post(mockUrl("/ai/furnish"), async ({ request }) => {
    await delay(300);

    const input = (await request.json()) as {
      roomId: string;
      roomType: string;
      style?: string;
      dimensions?: { width: number; height: number };
    };

    const suggestedNames = ROOM_SUGGESTIONS[input.roomType] ?? ROOM_SUGGESTIONS["generic"];
    const width = input.dimensions?.width ?? 400;
    const height = input.dimensions?.height ?? 300;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "status", message: "Analyzing room layout..." })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 500));

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "status", message: `Selecting furniture for ${input.roomType.replace("-", " ")}...` })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 500));

        const placements = [];
        const padding = 30;
        let currentX = padding;
        let currentY = padding;

        for (const name of suggestedNames) {
          const item = _furnitureItems.find((f) => f.name === name);
          if (!item) continue;

          const scaledWidth = item.width * 0.5;
          const scaledHeight = item.height * 0.5;

          if (currentX + scaledWidth > width - padding) {
            currentX = padding;
            currentY += 120;
          }

          if (currentY + scaledHeight > height - padding) break;

          const placement = {
            furnitureItemId: item.id,
            furnitureItem: item,
            x: currentX + Math.random() * 20,
            y: currentY + Math.random() * 20,
            rotation: 0,
          };

          placements.push(placement);
          currentX += scaledWidth + 20;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "placement", data: placement })}\n\n`),
          );
          await new Promise((r) => setTimeout(r, 300));
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "status", message: `Placed ${placements.length} items. Done!` })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 200));

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),
];
