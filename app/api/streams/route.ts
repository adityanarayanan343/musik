import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
const YT_REGEX = new RegExp("^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([a-zA-Z0-9_-]{11})(\S+)?$");
const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()
})

export async function POST(req:NextRequest){
    try{
        const data = CreateStreamSchema.parse(await req.json());
        const isYt = YT_REGEX.test(data.url);
        if(!isYt){
            return NextResponse.json({
                error: "Invalid URL"
            })
        }
        const extractedId = data.url.split("?v=")[1];
        const res = await youtubesearchapi.GetVideoDetails(extractedId);
        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a:{width:number},b:{width:number})=>a.width<b.width ?-1:1)
        const stream = await prismaClient.stream.create({
            data:{userId: data.creatorId,
            url: data.url,
            extractedId: extractedId,
            type: "Youtube",
            title: res.title ?? "Cant Find Video",
            smallImg: thumbnails.length > 1?thumbnails[thumbnails.length-2].url:thumbnails[thumbnails.length-1].url?? "https://imgs.search.brave.com/Od1mOiOVIdshqrLcUx0S1-BoN-dMcwU-Rs4XLQVk-uM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvZmVhdHVy/ZWQvZ29qby1zYXRv/cnUtcGljdHVyZXMt/OHN6NjJobHNnMWVw/bmk2bC5qcGc",
            bigImg: thumbnails[thumbnails.length-1].url??"https://imgs.search.brave.com/Od1mOiOVIdshqrLcUx0S1-BoN-dMcwU-Rs4XLQVk-uM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvZmVhdHVy/ZWQvZ29qby1zYXRv/cnUtcGljdHVyZXMt/OHN6NjJobHNnMWVw/bmk2bC5qcGc"
            }
        })
        return NextResponse.json({
            message: "Stream created successfully",
            id: stream.id
        })
    }
    catch(e){
        console.log(e);
        return NextResponse.json({
            message: "Error while adding a stream"
        },
    {
        status: 411
    })
    }
    
}

export async function GET(req:NextRequest) {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const streams = await prismaClient.stream.findMany({
        where:{
            userId: creatorId ?? ""
        }
})
    return NextResponse.json({
        streams
    })
    
}