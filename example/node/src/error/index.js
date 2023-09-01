import leak from '../leak/index'
class MyError extends Error {
    constructor(msg,code,data){
        super(msg);
        this.code = code;
        this.time = new Date().toLocaleString();
        this.handleData(data);
    }
    handleData(data){
        if(data){
            let properties=['info','type'];
            Object.keys(data).forEach(key=>{
                if(properties.includes(key)){
                    let v=data[key];
                    if(v instanceof Error){
                        v=JSON.stringify(v,Object.getOwnPropertyNames(v));
                        v=JSON.parse(v);
                    }
                    if(v !==undefined){
                        this[key]=v;
                    }
                }
            })
        }
    }
    get reason() {
        return this["child"];
    }
};

const paddingError=(msg,code,data)=>{
    let r=new MyError(msg,code,data);
    leak(r);
    return r;
}
export {
    paddingError
};