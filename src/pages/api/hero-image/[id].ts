import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Image proxy API route that fetches hero images from an alternative source.
 *
 * The original SuperHero API's images are hosted on superherodb.com which uses
 * Cloudflare protection that blocks all external requests with 403 Forbidden.
 *
 * This API route uses the akabab/superhero-api hosted on jsDelivr CDN,
 * which provides the same hero images without access restrictions.
 *
 * Usage: /api/hero-image/[heroId]
 * Example: /api/hero-image/1 returns A-Bomb's image
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing hero ID" });
  }

  const heroId = parseInt(id, 10);
  if (isNaN(heroId) || heroId < 1 || heroId > 731) {
    return res.status(400).json({ error: "Invalid hero ID" });
  }

  try {
    // Use the alternative superhero-api that hosts images on jsDelivr CDN
    // This API has the same hero IDs but with accessible image URLs
    const heroResponse = await fetch(
      `https://akabab.github.io/superhero-api/api/id/${heroId}.json`
    );

    if (!heroResponse.ok) {
      // If hero not found in alternative API, return 404
      if (heroResponse.status === 404) {
        return res.status(404).json({ error: "Hero not found" });
      }
      return res.status(heroResponse.status).json({ error: "Failed to fetch hero data" });
    }

    const heroData = await heroResponse.json();

    // Use medium size image for good quality/size balance
    // Available sizes: xs, sm, md, lg
    const imageUrl = heroData?.images?.md || heroData?.images?.lg || heroData?.images?.sm;

    if (!imageUrl) {
      return res.status(404).json({ error: "Hero image not found" });
    }

    // Fetch the actual image from jsDelivr CDN
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: "Failed to fetch image",
        status: imageResponse.status,
        statusText: imageResponse.statusText
      });
    }

    // Get the image content type
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Stream the image buffer to the client
    const imageBuffer = await imageResponse.arrayBuffer();

    // Set appropriate caching headers (cache for 7 days since these images don't change)
    res.setHeader("Cache-Control", "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000");
    res.setHeader("Content-Type", contentType);

    return res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Error proxying hero image:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
