import { z } from "zod";

export const furnishRoomSchema = z.object({
  body: z.object({
    roomId: z.string().min(1),
    roomType: z.string().min(1).max(50),
    style: z.string().min(1).max(100),
    width: z.number().positive(),
    height: z.number().positive(),
    existingFurniture: z.array(z.string()).optional(),
  }),
});
