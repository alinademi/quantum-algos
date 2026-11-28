import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../quantum.ts';
import * as g from './gate-lab.ts';

import { checkLabs,close } from './gate-lab-checks.ts';
import {interference} from './uncomputation.ts';
const {run,last}=await checkLabs(['uncomputation']);
test('junk record spoils interference: 5/8 instead of 1, with residual outcomes equally likely',()=>{interference(true).forEach((x,i)=>close(x,i===0?1:0));interference(false).forEach((x,i)=>close(x,i===0?5/8:1/8));close(last('uncomputation',{clear:'Yes'}).distribution!.p[0],1);close(last('uncomputation',{clear:'No'}).distribution!.p[0],5/8);});
