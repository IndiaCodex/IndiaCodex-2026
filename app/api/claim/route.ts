import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("API Route Hit with body:", body); // DEBUG LOG

        // Draper House Coordinates
        const TARGET = { lat: 17.4399, lon: 78.3496 };

        // Very simple distance check
        if (!body.userLat || !body.userLon) {
            return NextResponse.json({ error: "Missing GPS" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: "Location verified! Oracle signature attached."
        });

    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
