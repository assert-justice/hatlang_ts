import { OpLookup } from "./op_lookup";
import { Error } from "./error";
import { SourceMap } from "./source_map";
import { IP_HIGH_POS, IP_LOW_POS, STACK_POINTER_POS, STACK_SIZE } from "./constants";

export class Interpreter{
    // program: ArrayBuffer;
    program = new Uint8Array();
    signedView = new Int8Array();
    opLookup = new OpLookup();
    error = new Error("");
    fnMap: Map<number, ()=>void>;
    get ip(): number{
        const high = this.program[IP_HIGH_POS] << 8;
        const low = this.program[IP_LOW_POS];
        return high + low;
    }
    set ip(val: number){
        // TODO: bounds checking
        const high = val >> 8;
        const low = val - (high >> 8);
        this.program[IP_HIGH_POS] = high;
        this.program[IP_LOW_POS] = low;
    }
    get sp(): number{
        return this.program[STACK_POINTER_POS];
    }
    set sp(val: number){
        this.program[STACK_POINTER_POS] = val;
    }
    get stackTop(): number{
        return this.signedView[STACK_POINTER_POS + this.sp];
    }
    set stackTop(val: number){
        this.signedView[STACK_POINTER_POS + this.sp] = val;
    }
    // pop(): number{
    //     // underflow check in step()
    //     const res = this.signedView[STACK_POINTER_POS + this.len()];
    //     this.program[STACK_POINTER_POS]--;
    //     return res;
    // }
    // push(val: number){
    //     // overflow check in step()
    //     this.program[STACK_POINTER_POS]++;
    //     this.signedView[STACK_POINTER_POS + this.len()] = val;
    // }
    state: 'running' | 'paused' | 'stopped' = 'running';
    initialized = false;
    inbox: number[] = [];
    outbox: number[] = [];
    registers = [0,0,0,0,0,0,0,0,]
    validOutbox?: number[];
    constructor(){
        this.fnMap = new Map();
        const addFn = (name: string, fn: ()=>void)=>{
            name = name.toUpperCase();
            const op = this.opLookup.getByName(name);
            if(!op) throw `${name} is not an op name!`;
            this.fnMap.set(op.code, fn);
        }
        addFn("inp", ()=>this.inp());
        addFn("out", ()=>this.out());
        addFn("del", ()=>this.pop());
        addFn("dup", ()=>{
            const a = this.pop();
            this.push(a); this.push(a);
        });
        addFn("swp", ()=>{
            const a = this.pop();
            const b = this.pop();
            this.push(a); this.push(b);
        });
        addFn("len", ()=>this.push(this.sp));
        addFn("pze", ()=>this.push(0));
        addFn("psh", ()=>this.push(this.signedView[this.ip-1]));
        addFn("inc", ()=>this.push(this.pop()+1));
        addFn("dec", ()=>this.push(this.pop()-1));
        addFn("neg", ()=>this.push(-this.pop()));
        addFn("add", ()=>this.bin((a,b)=>a+b));
        addFn("sub", ()=>this.bin((a,b)=>a-b));
        addFn("jmp", ()=>this.jmp());
        addFn("jez", ()=>{if(this.pop() === 0)this.jmp()});
        addFn("jnz", ()=>{if(this.pop() !== 0)this.jmp()});
        addFn("jlz", ()=>{if(this.pop() < 0)this.jmp()});
        addFn("jgz", ()=>{if(this.pop() > 0)this.jmp()});
        addFn("lod", ()=>this.lod());
        addFn("sav", ()=>this.sav());
        addFn("hlt", ()=>this.hlt());
        addFn("brk", ()=>this.state = 'paused');
        addFn("rng", ()=>this.rng());
        addFn("dmp", ()=>this.dmp());
    }
    init(program: ArrayBuffer, inbox: number[], error: Error, validOutbox?: number[]){
        this.inbox = [...inbox];
        this.inbox.reverse();
        this.outbox = [];
        this.validOutbox = validOutbox;
        this.signedView = new Int8Array(program);
        this.program = new Uint8Array(program);
        this.error = error;
        this.initialized = true;
        this.registers = this.registers.map(()=>0);
    }
    checkInit(){
        if(!this.initialized) throw `Interpreter not initialized!`;
    }
    run(){
        this.checkInit();
        while(this.state === 'running' && !this.error.hasError) this.step();
    }
    pause(){
        this.state = 'paused';
    }
    halt(){
        this.state = 'stopped';
    }
    resume(){
        this.checkInit();
        if(!this.error.hasError) this.state = 'running';
    }
    setError(message: string){
        this.error.setErrorAtIdx(this.ip, message);
    }
    step(){
        const code = this.program[this.ip];
        if(code === 0){
            this.hlt();
            return;
        }
        const op = this.opLookup.getByCode(code);
        if(!op){
            this.setError(`Unrecognized opcode '${code}'`);
            return;
        }
        // TODO: check here for stack under/overflow
        const len = this.sp;
        
        if(op.pops > len){
            this.setError(`Stack underflow!`);
            return;
        }
        if(op.pushes - op.pops + len > STACK_SIZE){
            this.setError(`Stack overflow!`);
            return;
        }
        const fn = this.fnMap.get(code);
        if(!fn) throw 'invalid fn, should be unreachable';
        let opLen = 1;
        switch (op.arg) {
            case 'NONE':
                break;
            case 'LABEL':
                opLen+=2;
                break;
            case 'REGISTER':
                opLen+=1;
                break;
            case 'NUMBER':
                opLen+=1;
                break
            default:
                throw 'invalid arg, should be unreachable'
        }
        this.ip += opLen;
        fn();
    }
    // len(): number{
        // stack length
        // return this.program[STACK_POINTER_POS];
    // }
    pop(): number{
        // underflow check in step()
        const res = this.stackTop;
        // this.program[STACK_POINTER_POS]--;
        this.sp--;
        return res;
    }
    push(val: number){
        // overflow check in step()
        // this.program[STACK_POINTER_POS]++;
        this.sp++;
        this.stackTop = val;
    }
    bin(fn: (a: number, b: number)=>number){
        const b = this.pop();
        const a = this.pop();
        this.push(fn(a,b));
    }
    inp(){
        // check if inbox is empty. if it is, halt. not necessarily an error
        // if in validate mode, triggers final validation
        const val = this.inbox.pop();
        if(!val){
            this.state = 'stopped';
            return;
        }
        this.push(val);
    }
    out(){
        // if in validation mode, triggers partial/final validation
        this.outbox.push(this.pop());
    }
    jmp(){
        const high = this.program[this.ip-2] << 8;
        const low = this.program[this.ip-1];
        this.ip = high + low;
    }
    jsr(){
        const high = this.program[IP_HIGH_POS];
        const low = this.program[IP_LOW_POS];
        this.push(high);
        this.push(low);
        this.jmp();
    }
    ret(){
        const low = this.pop();
        const high = this.pop() >> 8;
        this.ip = high + low;
    }
    lod(){
        const r = this.program[this.ip-1] % 8;
        this.push(this.registers[r]);
    }
    sav(){
        const r = this.program[this.ip-1] % 8;
        this.registers[r] = this.pop();
    }
    hlt(){
        // if in validate mode trigger final validate
        this.state = 'stopped';
    }
    rng(){
        const val = Math.floor(Math.random() * 256);
        this.push(val);
    }
    dmp(){
        console.log("inbox:", this.inbox);
        console.log("outbox:", this.outbox);
        // print stack
        const stack: number[] = [];
        for(let idx = 0; idx < this.sp; idx++){
            stack.push(this.signedView[STACK_POINTER_POS + 1 + idx]);
        }
        console.log("stack:", stack);
        
    }
}