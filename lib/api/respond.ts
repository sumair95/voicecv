/**
 * Tiny helpers for uniform JSON responses from route handlers.
 * Keeps shape consistent so the client can always read `data.error`.
 */

import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

/** 402 — used when a premium action needs credits the user doesn't have. */
export function paymentRequired(message = "Premium credits required") {
  return NextResponse.json({ error: message, needsPurchase: true }, { status: 402 });
}

export function serverError(message = "Internal error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
