import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface LinkPreviewResponse {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

/**
 * Extracts OpenGraph metadata from HTML content
 */
function extractOpenGraphMetadata(html: string, baseUrl: string): Partial<LinkPreviewResponse> {
  const result: Partial<LinkPreviewResponse> = {};

  // Extract og:title
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch?.[1]) {
    result.title = ogTitleMatch[1];
  } else {
    // Fallback to <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
      result.title = titleMatch[1];
    }
  }

  // Extract og:description
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDescMatch?.[1]) {
    result.description = ogDescMatch[1];
  } else {
    // Fallback to meta name="description"
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch?.[1]) {
      result.description = descMatch[1];
    }
  }

  // Extract og:image
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch?.[1]) {
    let imageUrl = ogImageMatch[1];
    // Convert relative URLs to absolute
    if (imageUrl.startsWith("/")) {
      const urlObj = new URL(baseUrl);
      imageUrl = `${urlObj.origin}${imageUrl}`;
    }
    result.image = imageUrl;
  }

  // Extract og:site_name
  const ogSiteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSiteNameMatch?.[1]) {
    result.siteName = ogSiteNameMatch[1];
  }

  return result;
}

/**
 * Validates if a URL string is a valid HTTP(S) URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<LinkPreviewResponse>> {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { url: "", title: null, description: null, image: null, siteName: null },
        { status: 401 }
      );
    }

    // Extract URL from query parameters
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      return NextResponse.json(
        { url: "", title: null, description: null, image: null, siteName: null },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(urlParam)) {
      return NextResponse.json(
        { url: urlParam, title: null, description: null, image: null, siteName: null },
        { status: 400 }
      );
    }

    // Fetch the URL with 5s timeout
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(urlParam, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FounderSprint/1.0)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json({
          url: urlParam,
          title: null,
          description: null,
          image: null,
          siteName: null,
        });
      }

      html = await response.text();
    } catch (error) {
      // Timeout, network error, or other fetch issues
      console.error("[LinkPreview] Fetch error:", error);
      return NextResponse.json({
        url: urlParam,
        title: null,
        description: null,
        image: null,
        siteName: null,
      });
    }

    // Extract metadata
    const metadata = extractOpenGraphMetadata(html, urlParam);

    return NextResponse.json({
      url: urlParam,
      title: metadata.title || null,
      description: metadata.description || null,
      image: metadata.image || null,
      siteName: metadata.siteName || null,
    });
  } catch (error) {
    console.error("[LinkPreview] Unexpected error:", error);
    return NextResponse.json(
      { url: "", title: null, description: null, image: null, siteName: null },
      { status: 500 }
    );
  }
}

// TODO: Add rate limiting per user (e.g., 10 requests per minute) if needed
