import * as nanoid from "nanoid";
import { randomUUID } from 'crypto';

const NANOID_ALLOWED_CHARS = 'A1B2C3D4E5F6G7H8I9J0KLMNOPQRSTUVWXYZ';

export function generateUniqueCode(
    length: number = 8,
    allowedCharacters: string = NANOID_ALLOWED_CHARS
  ) {
    const nanoId = nanoid.customAlphabet(allowedCharacters, length);
    const uniqueId = nanoId();
    return uniqueId;
}

export function generateRandomUUID() {
    return randomUUID();
}
