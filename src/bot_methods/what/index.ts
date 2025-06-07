import { testWhat } from "./test";
import { testOpenAI } from "./testOpenAI";
import { 
    WhatMethod,
    WhatMethodName
} from "@/types";

export function getWhatMethod(name: WhatMethodName): WhatMethod {
    switch(name){
        case "test":
            return testWhat;
        case "testOpenAI":
            return testOpenAI;
    }
}