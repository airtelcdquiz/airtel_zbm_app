import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface InitialState {
    datas: {index:string, payload:{},}[]
}
const initialState: InitialState = {
    datas:[]
}

const slice = createSlice({
    name:"reduce-store",
    initialState,
    reducers: {
        store: (state, action: PayloadAction<{index:string, payload:{}}>)=>{
            const index = state.datas.findIndex(e=> e.index === action.payload.index);
            if(index === -1){
                state.datas.push({
                    ...action.payload
                })
            }else{
                state.datas[index] = action.payload;
            }
        },
        drop: (state, action)=>{
            state.datas = state.datas.filter(e=> e.index !== action.payload);
        }
    }
})


export default {
    reducer: slice.reducer,
    actions: slice.actions
}