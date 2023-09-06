import myError from '../log/db/handleDB'
const leak=async(data)=>{
    // console.log(data,storeErrorInIndexedDB);
    let saveError=await myError.storeErrorInIndexedDB(data);

}
export default leak;