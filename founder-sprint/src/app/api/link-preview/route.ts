import {
  MAX_PREVIEW_REDIRECTS,
  UnsafeLinkPreviewUrlError,
  isPreviewHtmlContentType,
  parseHttpUrl,
  readLimitedText,
  resolveRedirectUrl,
  validateFetchTarget,
} from "@/lib/link-preview-security";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface LinkPreviewResponse {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

function emptyPreview(url: string): LinkPreviewResponse {
  return { url, title: null, description: null, image: null, siteName: null };
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

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function fetchPreviewHtml(initialUrl: URL): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    let currentUrl = initialUrl;

    for (let redirectCount = 0; redirectCount <= MAX_PREVIEW_REDIRECTS; redirectCount++) {
      await validateFetchTarget(currentUrl);

      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FounderSprint/1.0)",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (isRedirectStatus(response.status)) {
        if (redirectCount === MAX_PREVIEW_REDIRECTS) return null;

        const nextUrl = resolveRedirectUrl(currentUrl, response.headers.get("location"));
        if (!nextUrl) return null;

        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) return null;
      if (!isPreviewHtmlContentType(response.headers.get("content-type"))) return null;

      return readLimitedText(response);
    }

    return null;
  } finally {
    clearTimeout(timeoutId);
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
      return NextResponse.json(emptyPreview(""), { status: 401 });
    }

    // Extract URL from query parameters
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      return NextResponse.json(emptyPreview(""), { status: 400 });
    }

    const previewUrl = parseHttpUrl(urlParam);
    if (!previewUrl) {
      return NextResponse.json(emptyPreview(urlParam), { status: 400 });
    }

    let html: string | null;
    try {
      html = await fetchPreviewHtml(previewUrl);
    } catch (error) {
      if (error instanceof UnsafeLinkPreviewUrlError) {
        return NextResponse.json(emptyPreview(urlParam), { status: 400 });
      }

      console.error("[LinkPreview] Fetch failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(emptyPreview(urlParam));
    }

    if (!html) {
      return NextResponse.json(emptyPreview(urlParam));
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
    console.error("[LinkPreview] Unexpected error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(emptyPreview(""), { status: 500 });
  }
}

// TODO: Add rate limiting per user (e.g., 10 requests per minute) if needed
