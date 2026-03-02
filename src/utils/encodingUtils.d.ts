export interface Position {
    x: number;
    y: number;
}

export interface SlotAdditionalValues {
    value1: number;
    value2: number;
    value3: number;
}

export default function encodeAll(
    positions: Position[],
    rulesets: string[],
    additionalValues: number[],
    color: number
): string[];

export function timeStamp(): bigint;
export function toBigInts(hexArray: string[]): bigint[];

export function decodeSlot1(hexString: string): { positions: Position[] };
export function decodeSlot1_withPadding(intNumber: bigint | number): { positions: Position[] };
export function decodeSlot2(hexString: string): { positions: Position[]; rules: string[] };
export function decodeSlot2_withPadding(intNumber: bigint | number): { positions: Position[]; rules: string[] };
export function decodeSlot3(hexString: string): { positions: Position[]; rules: string[]; additionalValues: SlotAdditionalValues; color: number };
export function decodeSlot3_withPadding(intNumber: bigint | number): { positions: Position[]; rules: string[]; additionalValues: SlotAdditionalValues; color: number };
