import { Error } from "./error";
import { Token, TokenType } from "./token";

// labels start with #, registers start with &, hex numbers start with a $

export function parse(src: string, error: Error): Token[]{
    src = src.toUpperCase();
    const tokens: Token[] = [];
    let start = 0;
    let current = 0;
    let line = 1;
    // let hasError = false;
    // let errorMessage = "";
    const peek = ()=>{
        return src[current];
    }
    // const next = ()=>{
    //     if(atEof()) return "";
    //     return src[current+1];
    // }
    const advance = ()=>{
        current++;
        return src[current-1];
    }
    const atEof = ()=>{
        return current >= src.length;
    }
    const addToken = (type: TokenType, literal: string)=>{
        tokens.push({
            type,
            literal,
            pos: start
        })
    }
    const isAlpha = (c: string):boolean=>{
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return alphabet.includes(c);
    }
    const isDigit = (c: string):boolean=>{
        const alphabet = "0123456789";
        return alphabet.includes(c);
    }
    const whitespace = ()=>{
        const chars = ' \t\r\n'
        if(atEof() || !chars.includes(peek())) return false;
        while (chars.includes(peek())){
            if(peek() === '\n') line++;
            advance();
        }
        return true;
    }
    const comment = ()=>{
        if(atEof() || peek() !== ';') return false;
        while(!atEof()){
            const c = advance();
            if(c === '\n'){
                line++;
                break;
            }
        }
        return true;
    }
    const op = ()=>{
        // const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if(atEof() || !isAlpha(peek())) return false;
        while(!atEof() && isAlpha(peek())) advance();
        addToken('op', src.slice(start, current));
        return true;
    }
    const label = (): boolean=>{
        if(peek() !== "#") return false;
        advance();
        if(atEof() || !isAlpha(peek())){
            error.setErrorAtChar(start, `Invalid label name`);
            return true;
        }
        while(!atEof() && isAlpha(peek())) advance();
        addToken('label', src.slice(start+1, current));
        return true;
    }
    const register = (): boolean=>{
        if(peek() !== "&") return false;
        advance();
        const c = peek();
        if(atEof() || !isDigit(c)){
            error.setErrorAtChar(start, "Invalid register name");
            return true;
        }
        advance()
        if(!atEof()){
            const temp = peek();
            if(isAlpha(temp) || isDigit(temp)){
                error.setErrorAtChar(start, "Invalid register name2");
                return true;
            }
        }
        addToken('register', c);
        return true;
    }
    const decimal = ():boolean => {
        if(!isDigit(peek())) return false;
        while(!atEof() && isDigit(peek())) advance();
        addToken('number', src.slice(start, current));
        return true;
    }
    const hex = ():boolean => {
        if(peek() !== '$') return false;
        advance();
        if(atEof() || !isDigit(peek())) {
            error.setErrorAtChar(start, "Invalid hex number");
            return true;
        }
        while(!atEof() && isDigit(peek())) advance();
        let lit = src.slice(start+1, current);
        const val = parseInt(lit, 16);
        addToken('number', ''+val);
        return true;
    }
    while(!atEof() && !error.hasError){
        start = current;
        if(whitespace()){}
        else if(comment()){}
        else if(op()){}
        else if(label()){}
        else if(register()){}
        else if(decimal()){}
        else if(hex()){}
        else{
            error.setErrorAtChar(start, `Unexpected character '${peek()}'`);
            break;
        }
    }
    if(error.hasError){
        return [];
    }
    return tokens;
}

export { Token };
