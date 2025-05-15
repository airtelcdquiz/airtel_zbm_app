import axios from "axios";
import { CookieProvider } from "./types";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";



const api = (cookies: CookieProvider | ReadonlyRequestCookies | RequestCookies) => {
    var baseHost = '';
  
    baseHost = `https://airtelquiz.saas.cd/api`;
    

    // console.log("BaseHost : ", baseHost);
    const axios_instance = axios.create({
        baseURL: `${baseHost}`,
        headers: {
            "Content-Type": "application/json"
        }
    })

    axios_instance.interceptors.request.use(config => {

        const access_token = cookies.get('session');
        console.log(access_token?.value)
        if (access_token != null) {
            config.headers['Authorization'] = `Bearer ${access_token.value}`;
        }
        return config;
    }, error => {
        console.log(error)
        return error;
    })


    axios_instance.interceptors.response.use(result => {
        return result;
    }, async error => {
        console.log(error)
        // try {
        //     if (error.response.status === 401) {
        //         const access = await refreshAccess(cookies);
        //         const config = error.config;
        //         config.headers = {
        //             ...config.headers,
        //             'Authorization': `Bearer ${access}`
        //         }
        //         const result = await axios.request(config);
        //         return Promise.resolve(result);
        //     }
        // } catch (e) {

        // }
        return Promise.reject(error);
    });

    return axios_instance;
}


export default api;