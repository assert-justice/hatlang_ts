export const PROGRAM_SIZE = 8192;
export const STACK_SIZE = 256;
export const SRT_STACK_SIZE = 32;

function defHelper(size: number){
    let addr = size;
    const fn = (off: number)=>{
        addr -= off;
        return addr;
    }
    return fn;
}

const help = defHelper(PROGRAM_SIZE);

export const STACK_START = help(STACK_SIZE);
export const SRT_STACK_START = help(SRT_STACK_SIZE);
export const STACK_POINTER_POS = help(1);
export const SRT_STACK_POINTER_POS = help(1);
export const IP_LOW_POS = help(1);
export const IP_HIGH_POS = help(1);
export const CODE_SIZE = PROGRAM_SIZE - IP_HIGH_POS;
// export const STACK_POINTER_POS = PROGRAM_SIZE - STACK_SIZE;
// export const IP_LOW_POS = STACK_POINTER_POS - 1;
// export const IP_HIGH_POS = IP_LOW_POS - 1;
// export const CODE_SIZE = PROGRAM_SIZE - 256 - 3;