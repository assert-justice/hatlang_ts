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
        let token = this.tokenLookup.get(idx);        
        if(!token){
            let dis = Infinity;
            for (const [key, to] of this.tokenLookup.entries()) {
                const tempDis = Math.abs(idx - key);
                if(tempDis < dis){
                    dis = tempDis;
                    token = to;
                }
            }
            if(!token)throw `Invalid program index ${idx}`;
        }
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
            if(idx === this.src.length-1){
                line = this.src.slice(start, idx+1);
                break;
            }
            if(c === '\n') {
                if(found){
                    line = this.src.slice(start, idx-1);
                    break;
                }
                start = idx+1;
                lineNumber++;
            }
        }
        const charInLine = charPos - start;
        return {line, lineNumber, charInLine};
    }
}