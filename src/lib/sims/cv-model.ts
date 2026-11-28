import { choice,details,row,deg,type Lab } from './gate-lab.ts';
export function gaussian(r:number,theta:number,d:number){
 const a=Math.exp(-2*r)/2,b=Math.exp(2*r)/2,co=Math.cos(theta),si=Math.sin(theta);
 return {x:d*co,p:d*si,vx:a*co*co+b*si*si,vp:a*si*si+b*co*co,cov:(a-b)*co*si};
}
export const lab:Lab={
 controls:[choice('r','Squeezing r',['0','0.3','0.7','1']),choice('theta','Phase-space angle (degrees)',['0','45','90','135']),choice('d','Displacement along x',['0','1','2','−1'].map(x=>x.replace('−','-')))],
 run:v=>{const r=+v.r,a=deg(v.theta),d=+v.d;const stages=[['Vacuum',gaussian(0,0,0)],['Squeeze',gaussian(r,0,0)],['Displace',gaussian(r,0,d)],['Rotate',gaussian(r,a,d)]] as const;return stages.map(([title,g])=>details(title,'Gaussian single-mode model; [x,p]=i, with vacuum variances 1/2. These are computed quadrature statistics.',[row('Mean x',g.x),row('Mean p',g.p),row('Variance x',g.vx),row('Variance p',g.vp),row('Symmetric covariance',g.cov),row('Determinant of covariance',g.vx*g.vp-g.cov*g.cov),row('Δx Δp',Math.sqrt(g.vx*g.vp))]))}
};

export function quadratureShots(mean:number,variance:number,n:number,rand:()=>number){return Array.from({length:n},()=>mean+Math.sqrt(variance)*Math.sqrt(-2*Math.log(Math.max(Number.MIN_VALUE,rand())))*Math.cos(2*Math.PI*rand()));}
