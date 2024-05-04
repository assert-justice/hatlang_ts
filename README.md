# HatLang Typescript

This is a HatLang interpreter written in TypeScript. HatLang is a stack based pseudo assembly language for the upcoming puzzle/programming game HatStack.

## Command Line Interface

- run [path to source]
- build [path to source] [path to destination]
- validate [path to source] [path to test]

## Interpreter Specification

The HatLang interpreter is an 8 bit virtual machine, from here on called the hvm. All values are treated as signed 8 bit integers with a few notable exceptions.

The hvm has 16,384 bytes of usable memory. The user's program is allocated the bulk of the memory. 256 bytes are reserved for the stack. A byte is reserved for the stack pointer and two bytes are reserved for the instruction pointer. If the instruction pointer somehow points outside of program memory the hvm halts with an error code.

The hvm also features eight 8 bit general purpose registers, separate from main memory.

## Instruction Set

| Name | Code | Pops | Pushes | Arg Type | Notes|
|---|---|---|---|---|---|
| Stack Manipulation |
|INP|0x00|0|1|NONE|Push the next input to the stack|
|OUT|0x01|1|0|NONE|Pop the top element and outbox it|
|DEL|0x02|1|0|NONE|Pop and delete the top element|
|DUP|0x03|1|2|NONE|Duplicate the top element and push it|
|SWP|0x04|2|2|NONE|Swap the top two elements and push them|
|LEN|0x05|2|2|NONE|Swap the top two elements and push them|
|PZE|0x06|0|1|NONE|Push a zero to the stack|
|PSH|0x07|0|1|NUMBER|Push a number literal to the stack|
| Arithmetic |
| INC | 0x10 | 1 | 1 | NONE | Increment the top element|
| DEC | 0x11 | 1 | 1 | NONE | Decrement the top element| 
| NEG | 0x12 | 1 | 1 | NONE | Negate the top element |
| ADD | 0x13 | 2 | 1 | NONE | Pop the two top elements, add them, and push the result |
| SUB | 0x14 | 2 | 1 | NONE | Pop the two top elements, subtract them, and push the result |
| Control Flow |
| JMP | 0x20 | 0 | 0 | LABEL | Jump unconditionally to the following label|
| JEZ | 0x21 | 1 | 0 | LABEL | Pops the top element. If it is equal to zero jump to the following label|
| JNZ | 0x22 | 1 | 0 | LABEL | Pops the top element. If it is not equal to zero jump to the following label|
| JGZ | 0x23 | 1 | 0 | LABEL | Pops the top element. If it is greater than zero jump to the following label|
| JLZ | 0x24 | 1 | 0 | LABEL | Pops the top element. If it is less than zero jump to the following label|
| JSR | 0x25 | 0 | 2 | LABEL | Jump to subroutine, pushing the instruction pointer to the stack in two bytes|
| RET | 0x26 | 2 | 0 | LABEL | Return from subroutine, popping the top two elements and using them as the instruction pointer|
| Registers |
| LOD | 0x30 | 0 | 1 | REG | Load a value from the given register and push it|
| SAV | 0x31 | 1 | 0 | REG | Pop a value and save it to the given register|
| Miscellaneous |
| LAB | 0x00 | 0 | 0 | LABEL | Pseudo instruction used to create labels in source files. Never emitted |
| HLT | 0x40 | 0 | 0 | NONE | Halt execution|
| BRK | 0x41 | 0 | 0 | NONE | Break execution, pausing the program|
| ERR | 0x42 | 0 | 0 | NUMBER | Halt execution with a given error code|
| DMP* | 0x43 | 0 | 0 | NONE | Dump the state of the interpreter|
| RNG* | 0x44 | 0 | 1 | NONE | Generates a random number between 0 and 255 inclusive |

\* debug only, not available to players 

## Error Codes

- tried to read from empty inbox
- tried to pop from an empty stack
- tried to push to a full stack
- instruction pointer out of bounds
- tried to execute invalid opcode