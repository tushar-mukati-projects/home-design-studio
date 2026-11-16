import { describe, test, expect, mock, beforeEach } from "bun:test";

type Saved = { update: Record<string, unknown> };
type UpdateMany = { where: Record<string, unknown>; data: Record<string, unknown> };

const retrieved = { status: "canceled" };
const stored = { subscriptionId: null as string | null };

const retrieve = mock(async (id: string) => ({
  id,
  status: retrieved.status,
  items: { data: [{ price: { id: "price_pro" } }] },
  cancel_at_period_end: false,
  current_period_end: 1_800_000_000,
  metadata: { userId: "u1" },
  customer: "cus_1",
}));

mock.module("stripe", () => ({
  default: class {
    subscriptions = { retrieve };
  },
}));

const saved: Saved[] = [];
const seen: string[] = [];
const prisma = {
  billingEvent: {
    findUnique: mock(async ({ where }: { where: { stripeEventId: string } }) =>
      seen.includes(where.stripeEventId) ? { id: "seen" } : null,
    ),
    create: mock(async () => ({})),
  },
  subscription: {
    upsert: mock(async (args: Saved) => {
      saved.push(args);
      return args.update;
    }),
    findUnique: mock(async () => ({ stripeSubscriptionId: stored.subscriptionId })),
    updateMany: mock(async ({ where }: UpdateMany) => ({
      count: where.stripeSubscriptionId === stored.subscriptionId ? 1 : 0,
    })),
  },
};

mock.module("@/lib/db", () => ({ prisma }));
mock.module("@/lib/config", () => ({
  config: {
    stripe: { secretKey: "sk_test", webhookSecret: "whsec", proPriceId: "price_pro" },
    nodeEnv: "test",
    logLevel: "error",
  },
  disabledFeatures: () => [],
}));

const { handleWebhookEvent } = await import("@/services/stripe.service");

const subscriptionPayload = {
  id: "sub_1",
  status: "active",
  items: { data: [{ price: { id: "price_pro" } }] },
  cancel_at_period_end: false,
  current_period_end: 1_800_000_000,
  metadata: { userId: "u1" },
  customer: "cus_1",
};

const event = (id: string, type: string, object: unknown) =>
  ({ id, type, data: { object } }) as never;

beforeEach(() => {
  saved.length = 0;
  seen.length = 0;
  retrieved.status = "canceled";
  stored.subscriptionId = null;
  retrieve.mockClear();
  prisma.billingEvent.findUnique.mockClear();
  prisma.billingEvent.create.mockClear();
  prisma.subscription.upsert.mockClear();
  prisma.subscription.findUnique.mockClear();
  prisma.subscription.updateMany.mockClear();
});

describe("handleWebhookEvent", () => {
  test("a late subscription.updated applies what Stripe holds now, not the stale payload", async () => {
    await handleWebhookEvent(event("evt_1", "customer.subscription.updated", subscriptionPayload));

    expect(retrieve).toHaveBeenCalledWith("sub_1");
    expect(saved).toHaveLength(1);
    expect(saved[0].update).toMatchObject({ plan: "free", status: "canceled" });
  });

  test.each(["past_due", "unpaid", "incomplete", "canceled"])(
    "a subscription that is %s maps to the free plan",
    async (status) => {
      retrieved.status = status;
      await handleWebhookEvent(
        event("evt_5", "customer.subscription.updated", subscriptionPayload),
      );
      expect(saved[0].update).toMatchObject({ plan: "free" });
    },
  );

  test("an update for a replaced subscription leaves the current one alone", async () => {
    stored.subscriptionId = "sub_2";
    retrieved.status = "active";
    await handleWebhookEvent(event("evt_6", "customer.subscription.updated", subscriptionPayload));

    expect(retrieve).not.toHaveBeenCalled();
    expect(saved).toHaveLength(0);
  });

  test("an update for the stored subscription is applied", async () => {
    stored.subscriptionId = "sub_1";
    retrieved.status = "active";
    await handleWebhookEvent(event("evt_7", "customer.subscription.updated", subscriptionPayload));

    expect(saved[0].update).toMatchObject({ plan: "pro", stripeSubscriptionId: "sub_1" });
  });

  test.each([
    ["paid", 1],
    ["no_payment_required", 1],
    ["unpaid", 0],
  ])("a checkout with payment_status %s grants Pro %d time(s)", async (paymentStatus, grants) => {
    retrieved.status = "active";
    await handleWebhookEvent(
      event("evt_2", "checkout.session.completed", {
        metadata: { userId: "u1" },
        payment_status: paymentStatus,
        subscription: "sub_1",
      }),
    );

    expect(saved).toHaveLength(grants);
    if (grants) expect(saved[0].update).toMatchObject({ plan: "pro", status: "active" });
  });

  test("records the event so a retry is a no-op", async () => {
    await handleWebhookEvent(event("evt_3", "customer.subscription.updated", subscriptionPayload));
    expect(prisma.billingEvent.create).toHaveBeenCalledTimes(1);

    seen.push("evt_3");
    await handleWebhookEvent(event("evt_3", "customer.subscription.updated", subscriptionPayload));
    expect(prisma.billingEvent.create).toHaveBeenCalledTimes(1);
    expect(saved).toHaveLength(1);
  });

  test("subscription.deleted drops the user to free only when it is the stored subscription", async () => {
    stored.subscriptionId = "sub_1";
    await handleWebhookEvent(event("evt_4", "customer.subscription.deleted", subscriptionPayload));

    expect(prisma.subscription.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", stripeSubscriptionId: "sub_1" },
      data: {
        plan: "free",
        status: "canceled",
        stripeSubscriptionId: null,
        stripePriceId: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      },
    });
    expect(saved).toHaveLength(0);
  });
});
