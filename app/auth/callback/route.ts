import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  
  // If there's an error (user denied access), redirect to homepage
  if (error) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Otherwise, redirect to homepage as well (successful auth)
  return NextResponse.redirect(new URL("/", request.url));
}
