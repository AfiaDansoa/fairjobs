<?php
// api/apply.php
// Receives application form data and returns a success message
// In a real app you would save to database or send email.
// Here we just validate and confirm (solves the "black hole" feeling).

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get data from form
$job_id   = trim($_POST['job_id'] ?? '');
$name     = trim($_POST['name'] ?? '');
$email    = trim($_POST['email'] ?? '');
$resume   = trim($_POST['resume'] ?? '');
$message  = trim($_POST['message'] ?? '');

// Very basic validation
if (empty($name) || empty($email) || empty($job_id)) {
    echo json_encode(['success' => false, 'message' => 'Name, email and job are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email.']);
    exit;
}

// In a real app: save to database or send email with mail()
// For this MVP we just return a friendly success message.
// You can also append to a local applications.json if you want (works on your computer).

$successMessage = "Thank you $name! Your application for job #$job_id has been received. The employer will be notified. (This is a demo – no real email was sent.)";

echo json_encode([
    'success' => true,
    'message' => $successMessage
]);
?>