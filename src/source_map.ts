import { Token } from "./token";

export interface SourceInfo{
    line: string;
    lineNumber: number;
    charInLine: number;
}

export class SourceMap{
    src: string = "";
    tokenLookup = new Map<number, Token>();
    constructor(src: string){
        this.src = src;
    }
    addToken(idx: number, token: Token){
        this.tokenLookup.set(idx, token);
    }
    getByIdx(idx: number): SourceInfo{
        const token = this.tokenLookup.get(idx);
        if(!token){throw `Invalid program index ${idx}`}
        const info = this.getByCharPos(token.pos);
        return info;
    }
    getByCharPos(charPos: number): SourceInfo{
        // this could be sped up but isn't performance critical
        let lineNumber = 1;
        let line = "";
        let start = 0;
        let found = false;
        for (let idx = 0; idx < this.src.length; idx++) {
            const c = this.src[idx];
            if(idx === charPos){
                found = true;
            }
            if(c === '\n') {
                start = idx;
                if(found){
                    line = this.src.slice(start, idx);
                    break;
                }
                lineNumber++;
            }
        }
        const charInLine = charPos - start;
        return {line, lineNumber, charInLine};
    }
}