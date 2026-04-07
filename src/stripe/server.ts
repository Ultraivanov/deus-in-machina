import http from "node:http";
import { createCheckoutSession, createPortalSession, verifyWebhookEvent, handleStripeEvent } from "./stripe.js";
import type { SqliteStore } from "../storage/sqlite.js";
import { makeError } from "../errors.js";

type JsonBody = Record<string, unknown>;

const readBody = (req: http.IncomingMessage) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const readJson = async (req: http.IncomingMessage) => {
  const body = await readBody(req);
  if (body.length === 0) return {} as JsonBody;
  return JSON.parse(body.toString("utf-8")) as JsonBody;
};

const json = (res: http.ServerResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

export const startStripeServer = (store?: SqliteStore) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  const port = Number(process.env.BUILDRAIL_STRIPE_PORT ?? 8787);
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "POST" && req.url === "/stripe/checkout") {
        const body = await readJson(req);
        const priceId = (body.price_id as string) || (process.env.STRIPE_PRICE_ID as string);
        if (!body.user_id || !priceId || !body.success_url || !body.cancel_url) {
          return json(res, 400, makeError("INVALID_INPUT", "Missing checkout fields.", false));
        }
        const session = await createCheckoutSession({
          user_id: body.user_id as string,
          price_id: priceId,
          success_url: body.success_url as string,
          cancel_url: body.cancel_url as string,
          email: body.email as string | undefined,
          store
        });
        if (!session) {
          return json(res, 500, makeError("STRIPE_NOT_CONFIGURED", "Stripe is not configured.", false));
        }
        return json(res, 200, { url: session.url });
      }

      if (req.method === "POST" && req.url === "/stripe/portal") {
        const body = await readJson(req);
        const portal = await createPortalSession({
          customer_id: body.customer_id as string,
          return_url: body.return_url as string
        });
        if (!portal) {
          return json(res, 500, makeError("STRIPE_NOT_CONFIGURED", "Stripe is not configured.", false));
        }
        return json(res, 200, { url: portal.url });
      }

      if (req.method === "POST" && req.url === "/stripe/webhook") {
        const payload = await readBody(req);
        const signature = req.headers["stripe-signature"] as string | undefined;
        const event = verifyWebhookEvent(payload, signature);
        if (!event) {
          return json(res, 400, makeError("INVALID_WEBHOOK", "Webhook signature invalid.", false));
        }
        await handleStripeEvent(event, store);
        return json(res, 200, { received: true });
      }

      res.statusCode = 404;
      res.end();
    } catch (err) {
      json(res, 500, makeError("INTERNAL_ERROR", "Stripe server error.", true));
    }
  });

  server.listen(port);
  return { server, port };
};
