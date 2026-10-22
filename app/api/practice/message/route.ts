// Streams the practice partner's next reply as plain text.
// The character's instructions are built here from the role-play definition; the browser only
// sends which conversation, the difficulty and the conversation so far.
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CONFIG, currentLeader, explain, fail, logUsage, OUT_OF_PRACTICE, parseRequest, practiceLeft, toMessages, underDailyLimit } from "@/lib/practice";

export async function POST(request: Request) {
  const userId = await currentLeader();
  if (!userId) return fail(401, "Your sign-in has expired. Sign in again, then resend your message.");

  const parsed = await parseRequest(await request.json().catch(() => null), userId);
  if (typeof parsed === "string") return fail(400, parsed);
  const { system, turns, orgId, enrollmentId, plan } = parsed;
  if ((await practiceLeft(enrollmentId, plan)) === 0) return fail(402, OUT_OF_PRACTICE);
  const messages = toMessages(turns);
  if (!messages.length || turns[turns.length - 1].role !== "leader") return fail(400, "Type a message first.");

  if (!(await underDailyLimit(userId, "message"))) {
    return fail(429, `You've reached today's limit of ${CONFIG.messagesPerDay} practice messages. It resets tomorrow. You can still end this conversation and get feedback.`);
  }

  const model = CONFIG.messageModel;
  const stream = anthropic().messages.stream(
    {
      model,
      max_tokens: 1024, // replies are one to four sentences
      system,
      messages,
      output_config: { effort: "low" }, // quick, conversational replies
    },
    { signal: request.signal },
  );

  let input = 0, output = 0;
  const events = stream[Symbol.asyncIterator]();
  // Wait for the first event so a setup failure (bad key, no credit) returns a proper error.
  let first: IteratorResult<Anthropic.MessageStreamEvent>;
  try {
    first = await events.next();
  } catch (err) {
    console.error("practice message failed to start", err);
    return fail(502, explain(err));
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const handle = (e: Anthropic.MessageStreamEvent) => {
        if (e.type === "message_start") input = e.message.usage.input_tokens;
        if (e.type === "message_delta") output = e.usage.output_tokens;
        if (e.type === "content_block_delta" && e.delta.type === "text_delta") controller.enqueue(encoder.encode(e.delta.text));
      };
      try {
        if (!first.done) handle(first.value);
        for (let next = await events.next(); !next.done; next = await events.next()) handle(next.value);
        controller.close();
      } catch (err) {
        // Leader pressed Stop, or the connection dropped mid-reply.
        if (!request.signal.aborted) console.error("practice message interrupted", err);
        controller.error(err);
      } finally {
        await logUsage({ userId, orgId, enrollmentId }, "message", model, input, output);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
