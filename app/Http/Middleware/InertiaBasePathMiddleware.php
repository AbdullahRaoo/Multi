<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Prepend the application base path (e.g. /meb) to Inertia page URLs.
 *
 * When running behind a reverse proxy that strips /meb/ from the URL,
 * Laravel sees requests at / instead of /meb/. This means Inertia's
 * response includes "/" as the page URL, and the browser shows "/".
 *
 * This middleware fixes the URL in Inertia responses so the browser
 * correctly shows /meb/... in the address bar.
 */
class InertiaBasePathMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $basePath = rtrim(parse_url(config('app.url'), PHP_URL_PATH) ?: '', '/');

        if (!$basePath) {
            return $response;
        }

        // Fix Inertia XHR responses (Content-Type: application/json with X-Inertia header)
        if ($response->headers->get('X-Inertia') === 'true') {
            $data = json_decode($response->getContent(), true);
            if (isset($data['url']) && !str_starts_with($data['url'], $basePath)) {
                $data['url'] = $basePath . $data['url'];
                $response->setContent(json_encode($data));
            }
            return $response;
        }

        // Fix initial full-page HTML response (data-page attribute contains JSON with url)
        $content = $response->getContent();
        if ($content && str_contains($content, 'data-page="')) {
            $content = preg_replace_callback(
                '/data-page="([^"]*)"/',
                function ($matches) use ($basePath) {
                    $decoded = htmlspecialchars_decode($matches[1]);
                    $pageData = json_decode($decoded, true);
                    if (isset($pageData['url']) && !str_starts_with($pageData['url'], $basePath)) {
                        $pageData['url'] = $basePath . $pageData['url'];
                    }
                    return 'data-page="' . htmlspecialchars(json_encode($pageData), ENT_QUOTES, 'UTF-8') . '"';
                },
                $content
            );
            $response->setContent($content);
        }

        return $response;
    }
}
