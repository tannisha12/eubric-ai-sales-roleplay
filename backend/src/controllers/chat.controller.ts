import type { NextFunction, Request, Response } from "express";
import { getChatReply } from "../services/chat.service";
import type { ChatRequestBody, ChatResponseBody } from "../types/chat";
import type { HttpError } from "../types/http";

export async function postChat(
  req: Request<unknown, ChatResponseBody, ChatRequestBody>,
  res: Response<ChatResponseBody>,
  next: NextFunction
): Promise<void> {
  const { message } = req.body ?? {};

  if (typeof message !== "string" || message.trim().length === 0) {
    const error: HttpError = new Error("`message` is required and must be a non-empty string.");
    error.statusCode = 400;
    next(error);
    return;
  }

  try {
    const reply = await getChatReply(req.body);
    res.status(200).json({ reply });
  } catch (err) {
    next(err);
  }
}
