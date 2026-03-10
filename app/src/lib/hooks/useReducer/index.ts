import { useAppDispatch, useAppSelector } from "@/lib/store"; 
import reducer from "./reducer";


const useReducer = (indexs:string[])=>{
    const datas = useAppSelector(state=> state.reduceStore.datas.filter( (e:any)=> indexs.includes(e.index)));
    const dispatch = useAppDispatch();
    const store = (index:string, payload:{})=>{
        dispatch(reducer.actions.store({index, payload}));
    }
    const drop = (index:string)=>{
        dispatch(reducer.actions.drop(index));
    }
    return {datas, store, drop};
}
 
export default useReducer;