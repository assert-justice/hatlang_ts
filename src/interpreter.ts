import { OpLookup } from "./op_lookup";
import { Error } from "./error";
import { IP_HIGH_POS, IP_LOW_POS, SRT_STACK_POINTER_POS, SRT_STACK_START, STACK_POINTER_POS, STACK_SIZE, STACK_START } from "./constants";

interface InitState{
    inrack?: number[];
    initStack?: number[];
    targetStack?: number[];
    targetOutrack?: number[];
    blacklist?: number[];
}

export class Interpreter{
    // program: ArrayBuffer;
    program = new Uint8Array();
    signedView = new Int8Array();
    opLookup = new OpLookup();
    error = new Error("");
    fnMap: Map<number, ()=>void>;
    cycles = 0;
    oldIp = 0;
    get ip(): number{
        const high = this.program[IP_HIGH_POS] << 8;
        const low = this.program[IP_LOW_POS];
        return high + low;
    }
    set ip(val: number){
        const high = val >> 8;
        const low = val - (high >> 8);
        this.program[IP_HIGH_POS] = high;
        this.program[IP_LOW_POS] = low;
    }
    get sp(): number{
        return this.program[STACK_POINTER_POS];
    }
    set sp(val: number){
        // TODO: add bounds checking. Don't want this sucker to silently overflow
        this.program[STACK_POINTER_POS] = val;
    }
    get stackTop(): number{
        return this.signedView[STACK_START + this.sp];
    }
    set stackTop(val: number){
        this.signedView[STACK_START + this.sp] = val;
    }
    get srtSp(): number{
        return this.program[SRT_STACK_POINTER_POS];
    }
    set srtSp(val: number){
        // bounds checking in jsr/ret
        this.program[SRT_STACK_POINTER_POS] = val;
    }
    get srtSpTop(): number{
        return this.program[SRT_STACK_START + this.srtSp];
    }
    set srtSpTop(val: number){
        this.program[SRT_STACK_START + this.srtSp] = val;
    }
    state: 'running' | 'paused' | 'stopped' = 'running';
    initialized = false;
    inrack: number[] = [];
    outrack: number[] = [];
    registers = [0,0,0,0,0,0,0,0,]
    targetOutrack?: number[];
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
        addFn("rot", ()=>this.rot())
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
        addFn("jsr", ()=>this.jsr());
        addFn("ret", ()=>this.ret());
        addFn("lod", ()=>this.lod());
        addFn("sav", ()=>this.sav());
        addFn("hlt", ()=>this.hlt());
        addFn("brk", ()=>this.state = 'paused');
        addFn("rng", ()=>this.rng());
        addFn("dmp", ()=>this.dmp());
    }
    // init(program: ArrayBuffer, inbox: number[], error: Error, validOutbox?: number[]){
    init(program: ArrayBuffer, error: Error, initState: InitState){
        this.inrack = initState.inrack ? [...initState.inrack] : [];
        this.ip = 0;
        this.sp = 0;
        this.state = "running";
        this.cycles = 0;
        this.inrack.reverse();
        this.outrack = [];
        if(initState.targetStack) for (const val of initState.targetStack) {
            this.push(val);
        }
        this.targetOutrack = initState.targetOutrack ? [...initState.targetOutrack] : undefined;
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
        this.error.setErrorAtIdx(this.oldIp, message);
    }
    step(){
        this.cycles++;
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
        this.oldIp = this.ip;
        this.ip += opLen;
        fn();
        // TODO: check if ip is inbounds
    }
    pop(): number{
        // underflow check in step()
        this.sp--;
        const res = this.stackTop;
        return res;
    }
    push(val: number){
        // overflow check in step()
        this.stackTop = val;
        this.sp++;
    }
    bin(fn: (a: number, b: number)=>number){
        const b = this.pop();
        const a = this.pop();
        this.push(fn(a,b));
    }
    inp(){
        // check if inbox is empty. if it is, halt. not necessarily an error
        const val = this.inrack.pop();
        if(!val){
            this.hlt();
            return;
        }
        this.push(val);
    }
    out(){
        // TODO: if in validation mode, triggers partial validation
        this.outrack.push(this.pop());
        if(!this.targetOutrack) return;
        if(this.outrack.length > this.targetOutrack.length){
            this.setError("Too many elements in outrack!");
            return;
        }
        for(let idx = 0; idx < this.outrack.length; idx++){
            if(this.outrack[idx] !== this.targetOutrack[idx]){
                this.setError("Invalid element in outrack!");
                return;
            }
        }
    }
    rot(){
        const a = this.pop();
        const b = this.pop();
        const c = this.pop();
        this.push(b);
        this.push(a);
        this.push(c);
    }
    jmp(){
        const high = this.program[this.ip-2] << 8;
        const low = this.program[this.ip-1];
        this.ip = high + low;
    }
    jsr(){
        if(this.srtSp >= 32){
            this.setError("Subroutine stack overflow!");
            return;
        }
        const high = this.program[IP_HIGH_POS];
        const low = this.program[IP_LOW_POS];
        this.srtSpTop = high;
        this.srtSp++;
        this.srtSpTop = low;
        this.srtSp++;
        this.jmp();
    }
    ret(){
        if(this.srtSp <= 1){
            this.setError("Subroutine stack underflow!");
            return;
        }
        this.srtSp--;
        this.program[IP_LOW_POS] = this.srtSpTop;
        this.srtSp--;
        this.program[IP_HIGH_POS] = this.srtSpTop;
        
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
        if(this.targetOutrack && this.targetOutrack.length > this.outrack.length){
            this.setError("Not enough elements in outrack!");
        }
        if(this.sp > 0){
            this.setError("Stack must be empty at the end of execution!");
        }
    }
    rng(){
        const val = Math.floor(Math.random() * 256);
        this.push(val);
    }
    dmp(){
        console.log("inbox:", this.inrack);
        console.log("outbox:", this.outrack);
        // print stack
        const stack: number[] = [];
        for(let idx = 0; idx < this.sp; idx++){
            stack.push(this.signedView[STACK_START + idx]);
        }
        console.log("stack:", stack);
        
    }
}