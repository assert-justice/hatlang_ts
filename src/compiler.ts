import { Token } from "./parser";
import langDef from "./lang_def.json"
import { Error } from "./error";
import { PROGRAM_SIZE } from "./constants";
import { argv } from "process";

interface JumpTableEntry{
    idx: number;
    targets: number[];
    isIdxSet: boolean;
    pos: number;
}

class JumpTable{
    data: Map<string, JumpTableEntry>;
    constructor(){
        this.data = new Map();
    }
    private initEntry(name: string): JumpTableEntry{
        const res: JumpTableEntry = {
            idx: 0,
            targets: [],
            isIdxSet: false,
            pos: 0,
        };
        this.data.set(name, res);
        return res;
    }
    has(name: string){
        return this.data.has(name);
    }
    get(name: string): JumpTableEntry{
        let res = this.data.get(name);
        if(!res){
            res = this.initEntry(name);
        }
        return res;
    }
    setIdx(name: string, idx: number, pos: number){
        const entry = this.get(name);
        if(entry.isIdxSet) return `Attempt to reset the name '${name}'`;
        entry.isIdxSet = true; 
        entry.idx = idx;
        entry.pos = pos;
    }
    addTarget(name: string, idx: number){
        const entry = this.get(name);
        // TODO: check if target idx is unique?
        entry.targets.push(idx);
    }
}

interface Op{
    name: string;
    code: number;
    pops: number;
    pushes: number;
    arg: string;
}

class OpLookup{
    data: Map<string, Op>;
    
    constructor(){
        this.data = new Map();
        for (const op of langDef) {
            this.data.set(op.name, op);
        }
    }
    has(name: string): boolean{
        return this.data.has(name);
    }
    get(name: string){
        const res = this.data.get(name);
        if(!res) {
            return `Invalid op name '${name}'`;
        }
        return res;
    }
}

export function compile(tokens: Token[], error: Error): ArrayBuffer{
    const data = new ArrayBuffer(PROGRAM_SIZE);
    const view = new Uint8Array(data);
    const jumpTable = new JumpTable();
    const opLookup = new OpLookup();
    let current = 0;
    let idx = 0;
    const atEof = (): boolean=>{
        return current >= tokens.length;
    }
    // const peek = ()=>{
    //     return tokens[current];
    // }
    const advance = ()=>{
        current++;
        return tokens[current-1];
    }
    const emit = (val: number)=>{
        // TODO: bounds checking
        view[idx] = val;
        idx++;
    }
    while(!atEof()){
        const token = advance();
        
        if(token.type !== "op") {
            error.setErrorAtChar(token.pos, `Identifier '${token.literal}' is not an operation!`);
            break;
        }
        if(!opLookup.has(token.literal)){
            error.setErrorAtChar(token.pos, `Identifier '${token.literal}' is not an operation!`);
            break;
        }
        const op = opLookup.get(token.literal);
        error.sourceMap.addToken(idx, token);
        if(typeof op === 'string'){
            error.setErrorAtChar(token.pos, op);
            continue;
        }
        const {name, code, arg} = op;
        
        if(arg === "NONE") {
            emit(code);
            continue;
        }
        if(atEof()){
            error.setErrorAtChar(token.pos, "Unexpected EOF");
            break;
        }
        const argVal = advance();
        switch (arg) {
            case "NUMBER":
                if(argVal.type === 'number') {
                    // TODO: add bounds checking
                    emit(code);
                    emit(+argVal.literal);
                    continue;
                }
                error.setErrorAtChar(argVal.pos, `Expected a number literal, instead found a ${argVal.type}`);
                break;
            case "REGISTER":
                if(argVal.type === 'register') {
                    emit(code);
                    // TODO: add bounds checking
                    emit(+argVal.literal);
                    continue;
                }
                error.setErrorAtChar(argVal.pos, `Expected a register, instead found a ${argVal.type}`);
                break;
            case "LABEL":
                if(argVal.type !== 'label') {
                    error.setErrorAtChar(argVal.pos,`Expected a label, instead found a ${argVal.type}`);
                    continue;
                }
                if(token.literal === "LAB"){
                    jumpTable.setIdx(argVal.literal, idx, token.pos);
                    continue;
                }
                // handles all jump targets
                emit(code);
                jumpTable.addTarget(argVal.literal, idx);
                emit(0);
                emit(0);
                break;
            default:
                error.setErrorAtChar(argVal.pos,`Unexpected ${argVal.type}`);
                break;
        }
    }
    if(error.hasError){
        return new ArrayBuffer(0);
    }
    // resolve labels
    for (const [name, {idx, targets, isIdxSet, pos}] of jumpTable.data.entries()) {
        if(!isIdxSet){
            error.setErrorAtChar(pos, `Label '${name}' is never set!`);
            new ArrayBuffer(0);
        }
        // Should this be an error? I don't want to bother with warnings.
        // if(entry.targets.length === 0){
        //     error.setError(`Label '${name}' is never used!`, entry.pos);
        //     return error;
        // }
        let high = idx >> 8;
        let low = idx - (high << 8);
        for (const target of targets) {
            // yeah, we're doing big endian. deal with it
            view[target] = high;
            view[target+1] = low;
        }
    }
    return data;
}