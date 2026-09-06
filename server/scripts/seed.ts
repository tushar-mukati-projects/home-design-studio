import { prisma } from "../src/lib/db";
import { seedFurniture } from "../src/services/furniture.service";
import { seedTemplates } from "../src/services/template.service";

// Seeds the catalog and templates without booting the API. The server also runs
// both on start, so this is only needed after a reset.
await seedFurniture();
await seedTemplates();

const [items, templates, designs] = await Promise.all([
  prisma.furnitureItem.count(),
  prisma.designTemplate.count(),
  prisma.design.count(),
]);
console.log(`furniture_items: ${items}, design_templates: ${templates}, designs: ${designs}`);
await prisma.$disconnect();
