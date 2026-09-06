import { http, HttpResponse, delay } from "msw";
import { _furnitureItems } from "../store";
import { mockUrl } from "../config";

const ROOM_SUGGESTIONS: Record<string, string[]> = {
  living_room: ["Sofa", "Coffee Table", "Armchair", "TV Stand", "Floor Lamp", "Bookshelf"],
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
      width?: number;
      height?: number;
    };

    const suggestedNames = ROOM_SUGGESTIONS[input.roomType] ?? ROOM_SUGGESTIONS["generic"];
    const width = input.width ?? 4000;
    const height = input.height ?? 3000;

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
            `data: ${JSON.stringify({ type: "status", message: `Selecting furniture for ${input.roomType.replace("_", " ")}...` })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 500));

        const placements = [];
        const padding = 300;
        let currentX = padding;
        let currentY = padding;

        for (const name of suggestedNames) {
          const item = _furnitureItems.find((f) => f.name === name);
          if (!item) continue;

          const [w, d] = item.size;
          if (currentX + w > width - padding) {
            currentX = padding;
            currentY += 1200;
          }
          if (currentY + d > height - padding) break;

          placements.push({
            item: item.id,
            at: [Math.round(currentX + w / 2), Math.round(currentY + d / 2)],
            rotation: 0,
          });
          currentX += w + 200;
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "suggestions", placements })}

`),
        );

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
