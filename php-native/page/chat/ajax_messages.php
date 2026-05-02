<?php
require_once '../../config/function.php';
header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode([]);
    exit;
}

$ticket_id = $_GET['id'] ?? '';
if (!$ticket_id) {
    echo json_encode([]);
    exit;
}

$messages = getChatMessages($ticket_id);
echo json_encode($messages);
