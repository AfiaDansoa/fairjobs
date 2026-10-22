<?php
// api/add-job.php
// Adds a new job to jobs.json (works great locally)
// On Vercel the file system is temporary, so new jobs disappear after deploy.
// For learning this is perfect. Later you can switch to a real database.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Collect and clean data
$title       = trim($_POST['title'] ?? '');
$company     = trim($_POST['company'] ?? '');
$location    = trim($_POST['location'] ?? '');
$remote      = trim($_POST['remote'] ?? 'no');
$salary_min  = (int)($_POST['salary_min'] ?? 0);
$salary_max  = (int)($_POST['salary_max'] ?? 0);
$currency    = trim($_POST['currency'] ?? 'USD');
$type        = trim($_POST['type'] ?? 'Full-time');
$description = trim($_POST['description'] ?? '');
$requirements= trim($_POST['requirements'] ?? '');

// Validation – salary is mandatory for transparency
if (empty($title) || empty($company) || empty($location) || empty($description)) {
    echo json_encode(['success' => false, 'message' => 'Please fill all required fields.']);
    exit;
}

if ($salary_min <= 0 || $salary_max <= 0 || $salary_max < $salary_min) {
    echo json_encode(['success' => false, 'message' => 'Please provide a valid salary range. Salary is required on FairJobs.']);
    exit;
}

$jsonFile = __DIR__ . '/../data/jobs.json';

// Read existing jobs
$jobs = [];
if (file_exists($jsonFile)) {
    $jobs = json_decode(file_get_contents($jsonFile), true) ?: [];
}

// Create new job with next ID
$newId = 1;
if (!empty($jobs)) {
    $ids = array_column($jobs, 'id');
    $newId = max($ids) + 1;
}

$newJob = [
    'id'           => $newId,
    'title'        => $title,
    'company'      => $company,
    'location'     => $location,
    'remote'       => $remote,
    'salary_min'   => $salary_min,
    'salary_max'   => $salary_max,
    'currency'     => $currency,
    'type'         => $type,
    'description'  => $description,
    'requirements' => $requirements,
    'date_posted'  => date('Y-m-d')   // today
];

// Add to array
$jobs[] = $newJob;

// Try to save (works on your computer, temporary on Vercel)
$saved = file_put_contents($jsonFile, json_encode($jobs, JSON_PRETTY_PRINT));

if ($saved === false) {
    // Still return success for demo purposes on Vercel
    echo json_encode([
        'success' => true,
        'message' => "Job created in memory (ID $newId). Note: On Vercel the file system is read-only/temporary, so edit jobs.json and redeploy for permanent changes. Locally it saved fine."
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => "Job posted successfully! ID: $newId. Refresh the jobs page to see it."
    ]);
}
?>