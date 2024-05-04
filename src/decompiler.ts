import langDef from "./lang_def.json"

class OpLookup{
    data: Map<number, [string,string]>;
    constructor(){
        this.data = new Map();
        for (const {name, code, arg} of langDef) {
            if(name === 'LAB') continue;
            this.data.set(code, [name, arg]);
        }
    }
    get(code: number){
        const res = this.data.get(code);
        if(!res) throw `Invalid code ${code}`;
        return res;
    }
}

export function decompile(view: Uint8Array){
    const lookup = new OpLookup();
    const res: string[] = [];
    for(let idx = 0; idx < view.length; idx++){
        const code = view[idx];
        
        if(code === 0) break;
        // console.log(code);
        const [name, arg] = lookup.get(code);
        res.push(name);
        switch (arg) {
            case "NONE":
                // do nothing
                break;
            case "NUMBER":
                res.push(''+view[idx+1]);
                idx++;
                break;
            case "REGISTER":
                res.push('r'+view[idx+1]);
                idx++;
                break;
            case "LABEL":
                const high = view[idx+1] >> 8;
                const low = view[idx+2];
                res.push((high + low) + '');
                idx+=2;
                break;
            default:
                break;
        }
    }
    console.log(res.join(" "));
}