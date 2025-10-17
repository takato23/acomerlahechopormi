import { expect, test } from '@playwright/test';
import { promises as fs } from 'fs';

const SAMPLE_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQDw8QDw8PDw8QDw8PDw8PFQ8PFhAVFRUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDQ0NDw0NDisZFRkrKzcrKysrKzcrKysrKys3KysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAKgBLAMBIgACEQEDEQH/xAAZAAEAAwEBAAAAAAAAAAAAAAAABQYHAQL/xAAqEAACAQMDAQYHAAAAAAAAAAABAgMABBEFEiExBhNBUWFxBxQiMoGh0f/EABYBAQEBAAAAAAAAAAAAAAAAAAABAv/EABkRAQADAQEAAAAAAAAAAAAAAAEAAgMRIf/aAAwDAQACEQMRAD8Ao4vlg9NyjqYkDkwg+I5bg/rV3FppO5wkqjA4xgk9/X7qZ5DcHcskcnByfWuhvxmeZHK2Y04LZlc9tDRo9msl0YLMgnvTaG0dS45ZZCiSfc9ax3MxwZ4RzxWn//2Q==';

test('subo foto y aparece borrador de Vision', async ({ page }, testInfo) => {
  await page.route('**/api/vision-intake**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    }

    if (request.method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          insight: {
            id: 'insight-playwright',
            hash: 'hash-playwright',
            status: 'completed',
            source: 'gemini',
            summary: 'Se detectó calabaza y queso rallado listos para usar.',
            ingredients: [
              { name: 'Calabaza', confidence: 0.88 },
              { name: 'Queso rallado', confidence: 0.82 },
            ],
            recommendedActions: [
              {
                id: 'action-plan-soup',
                type: 'plan_meal',
                label: 'Planificar sopa de calabaza',
                confidence: 0.7,
              },
            ],
            capturedAt: new Date().toISOString(),
            latencyMs: 640,
            cost: {
              tokensIn: 1200,
              tokensOut: 450,
              usd: 0.0065,
              model: 'gemini-1.5-flash',
              promptVersion: 'vision_insight_v1',
              cacheHit: false,
            },
            imageStoragePath: 'vision-insights/mock-user/hash-playwright.jpg',
            imageExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            imageContentType: 'image/jpeg',
            imageBucket: 'vision-insights',
          },
          requestId: 'req-playwright',
          cacheHit: false,
        }),
      });
    }

    return route.fallback();
  });

  await page.goto('/app/planning');

  await expect(page.getByRole('heading', { name: /Sube una foto/i })).toBeVisible();

  const filePath = testInfo.outputPath('vision-sample.jpg');
  await fs.writeFile(filePath, Buffer.from(SAMPLE_IMAGE_BASE64, 'base64'));
  await page.setInputFiles('input[type="file"]', filePath);

  await expect(page.getByText(/Se detectó calabaza y queso/i)).toBeVisible();
  await expect(page.getByText(/Planificar sopa de calabaza/i)).toBeVisible();
});
