import { Token } from "./token";
import { SourceInfo, SourceMap } from "./source_map";

interface ErrorMessage{
    message: string;
    idx?: number;
    charPos?: number;
}

export class Error{
    sourceMap: SourceMap;
    get hasError(){return this._messages.length > 0;}
    private _messages: ErrorMessage[] = [];
    get message(){
        return this._messages.map(({message, idx, charPos})=>{
            // const lines: string[] = [];
            let info: SourceInfo;
            if(charPos !== undefined){
                info = this.sourceMap.getByCharPos(charPos);
            }
            else if(idx !== undefined){
                info = this.sourceMap.getByIdx(idx);
            }
            else{
                throw `should be unreachable`;
            }
            message = `Error on line ${info.lineNumber}: ${message}`;
            const charMark = Array(info.line.length).fill(null).map((_,idx)=>idx === info.charInLine ? "^" : "=");
            return [message, info.line, charMark].join("\n");
        }).join("\n");
    }
    constructor(src: string){
        this.sourceMap = new SourceMap(src);
    }
    setErrorAtChar(charPos: number, message: string){
        this._messages.push({message, charPos});
    }
    setErrorAtIdx(idx: number, message: string){
        this._messages.push({message, idx});
    }
    clear(){
        this._messages = [];
    }
}