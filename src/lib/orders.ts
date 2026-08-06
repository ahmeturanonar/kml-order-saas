import { ORDER_NUMBER_OFFSET } from "@/lib/constants";

export function toOrderNumber(sequenceNumber: number) {
  return `#${ORDER_NUMBER_OFFSET + sequenceNumber}`;
}
