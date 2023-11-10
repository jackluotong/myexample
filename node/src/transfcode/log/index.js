class MyTest{
    constructor(msg,info,data){
        this.msg = msg;
        this.info = info;
        this.createTime=new Date().toLocaleString();
        this.test='class test';
        this.extractData(data);
    }
    getInfo(){
        return this;
    }
    extractData(data){
        const property=['age','sex','other'];
        if(data){
            this.data=data;
            Object.keys(data).forEach(p=>{
                if(property.includes(p)){
                    let v=data[p];
                    // v = JSON.stringify(v, Object.getOwnPropertyNames(v));
                    // v=JSON.parse(v);
                    if(v!==undefined){
                        this[p] = v;
                    }
                }
            })
        }
    }
}
const deployTest=(msg,info,data)=>{
    let result=new MyTest(msg,info,data);
    console.log(result);
}
export  {MyTest,deployTest};