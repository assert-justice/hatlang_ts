import { Token } from "./token";
import { SourceMap } from "./source_map";

interface ErrorMessage{
    message: string;
    idx?: number;
    charPos?: number;
}

export class Error{
    // src: string = "";
    // pos = 0;
    // static fromSource(src: string): Error{
    //     return new Error(new SourceMap(src));
    // }
    sourceMap: SourceMap;
    get hasError(){return this._messages.length > 0;}
    private _messages: ErrorMessage[] = [];
    get message(){
        // TODO: improve error reporting
        return this._messages.map(m=>m.message).join("\n");
    }
    constructor(src: string){
        this.sourceMap = new SourceMap(src);
    }
    setErrorAtChar(charPos: number, message: string){
        // TODO: throw error if a message has already been set?
        this._messages.push({message, charPos});
    }
    setErrorAtIdx(idx: number, message: string){
        // TODO: actually implement this
        this._messages.push({message, charPos: -1});
    }
}