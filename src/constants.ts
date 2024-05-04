export const PROGRAM_SIZE = 8192;
export const STACK_SIZE = 256;
export const STACK_POINTER_POS = PROGRAM_SIZE - STACK_SIZE;
export const IP_LOW_POS = STACK_POINTER_POS - 1;
export const IP_HIGH_POS = IP_LOW_POS - 1;
export const CODE_SIZE = PROGRAM_SIZE - 256 - 3;
