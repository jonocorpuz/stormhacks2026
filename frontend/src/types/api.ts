import { z } from 'zod';

// --- Request: POST /api/extract ---

export const ExtractRequestSchema = z
  .object({
    image: z.string().min(1), // Base64 screenshot (no data-URL prefix)
    mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  })
  .strict();

export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

// --- Response: one of 4 widget payloads ---

export const ConsumerLinksWidgetSchema = z
  .object({
    type: z.literal('consumer_links'),
    title: z.string(),
    price: z.string(),
    brand: z.string(),
    rating: z.string().nullable(),
    reviews: z.string().nullable(),
    previewUrl: z.string().nullable(), // preview link button
    embedCode: z.string().nullable(), // embedded site code / copy button
  })
  .strict();

export const CodeViewerWidgetSchema = z
  .object({
    type: z.literal('code_viewer'),
    title: z.string(),
    code: z.string(),
    viewUrl: z.string().nullable(), // view code button
  })
  .strict();

export const ReceiptItemSchema = z
  .object({
    name: z.string(),
    price: z.string(),
  })
  .strict();

export const ReceiptWidgetSchema = z
  .object({
    type: z.literal('receipt'),
    title: z.string(),
    date: z.string(),
    total: z.string(),
    tax: z.string().nullable(),
    items: z.array(ReceiptItemSchema),
  })
  .strict();

export const LocationPinWidgetSchema = z
  .object({
    type: z.literal('location_pin'),
    title: z.string(),
    location: z.string(), // address string for the map view
    directionsAvailable: z.boolean(),
  })
  .strict();

export const WidgetPayloadSchema = z.discriminatedUnion('type', [
  ConsumerLinksWidgetSchema,
  CodeViewerWidgetSchema,
  ReceiptWidgetSchema,
  LocationPinWidgetSchema,
]);

export const ExtractResponseSchema = WidgetPayloadSchema;

export type ConsumerLinksWidget = z.infer<typeof ConsumerLinksWidgetSchema>;
export type CodeViewerWidget = z.infer<typeof CodeViewerWidgetSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ReceiptWidget = z.infer<typeof ReceiptWidgetSchema>;
export type LocationPinWidget = z.infer<typeof LocationPinWidgetSchema>;
export type WidgetPayload = z.infer<typeof WidgetPayloadSchema>;
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;
export type WidgetType = WidgetPayload['type'];
