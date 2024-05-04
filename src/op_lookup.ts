import langDef from "./lang_def.json"

export interface Op{
    name: string;
    code: number;
    pops: number;
    pushes: number;
    arg: string;
}

export class OpLookup{
    codeToOp: Map<number, Op>;
    nameToOp: Map<string, Op>;
    constructor(){
        this.codeToOp = new Map();
        this.nameToOp = new Map();
        for (const op of langDef) {
            if(op.name === 'LAB') continue;
            this.codeToOp.set(op.code, op);
            this.nameToOp.set(op.name, op);
        }
    }
    getByCode(code: number){
        return this.codeToOp.get(code);
    }
    getByName(name: string){
        return this.nameToOp.get(name);
    }
}