import {PaymentDetail} from "@/components/business/payment-detail";
export const metadata={title:"Payment details"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PaymentDetail id={id}/>;}
