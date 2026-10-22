<?php
// api/jobs.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$possiblePaths = [
    __DIR__ . '/jobs-data.json',           // best location on Vercel
    __DIR__ . '/../data/jobs.json',        // original location
    __DIR__ . '/../../data/jobs.json',
];

$jobs = null;
$usedPath = null;

foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $content = file_get_contents($path);
        $jobs = json_decode($content, true);
        $usedPath = $path;
        break;
    }
}

if ($jobs === null) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Jobs file not found',
        'tried' => $possiblePaths,
        'dir'   => __DIR__
    ]);
    exit;
}

// Sort newest first
usort($jobs, function($a, $b) {
    return strcmp($b['date_posted'], $a['date_posted']);
});

echo json_encode($jobs);
?>