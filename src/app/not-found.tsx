import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {return <div className="bos-system-state"><span className="bos-system-glyph"><Compass size={34} strokeWidth={1.3}/></span><span className="bos-panel-index">A DIFFERENT DIRECTION</span><h1>This workspace page doesn’t exist.</h1><p>Let’s find your way back to the bigger picture.</p><Button asChild><Link href="/"><ArrowLeft size={15}/>Return to overview</Link></Button></div>;}
