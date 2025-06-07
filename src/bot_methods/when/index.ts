import { testWhen } from "./test";
import { 
    WhenMethod,
    WhenMethodName
} from "@/types";

export function getWhenMethod(name: WhenMethodName): WhenMethod {
    switch(name){
        case "test":
            return testWhen;
    }
}