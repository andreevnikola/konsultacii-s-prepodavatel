import { randomBytes } from "crypto";
import QRCode from "qrcode";

export function generateQrCodeSlug(): string {
  return randomBytes(8).toString("hex");
}

export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url);
}
