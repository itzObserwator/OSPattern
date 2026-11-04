"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
export default function Error({reset}: {reset:()=>void}) {return <div className="bos-system-state" role="alert"><span className="bos-system-glyph"><AlertCircle size={32} strokeWidth={1.3}/></span><span className="bos-panel-index">LET’S TRY THAT AGAIN</span><h1>We couldn’t load this workspace.</h1><p>Your next view is a retry away.</p><Button onClick={reset} variant="primary"><RotateCcw size={15}/>Try again</Button></div>;}
