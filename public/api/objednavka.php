<?php
// Prijíma objednávky z formulára a posiela ich e-mailom cez PHP mail() na FORPSI hostingu.
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const RECIPIENT = 'info@detickovocafe.sk';
const SENDER = 'info@detickovocafe.sk'; // musí byť existujúca schránka na doméne (požiadavka FORPSI)
const SUBJECT = 'Nová nezáväzná objednávka z webu Detičkovo';
const MAX_FIELD_LEN = 3000;
const RATE_LIMIT = 5;          // max. odoslaní…
const RATE_WINDOW = 3600;      // …za hodinu z jednej IP

function respond(int $status, bool $success): void {
    http_response_code($status);
    echo json_encode(['success' => $success]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false);
}

// Jednoduchý rate limit na IP (súbor s časovými značkami v tmp)
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$rlFile = sys_get_temp_dir() . '/detickovo-form-' . md5($ip);
$stamps = is_file($rlFile) ? array_filter(
    array_map('intval', file($rlFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)),
    fn (int $t) => $t > time() - RATE_WINDOW
) : [];
if (count($stamps) >= RATE_LIMIT) {
    respond(429, false);
}

$data = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($data)) {
    respond(400, false);
}

// Honeypot: pole botcheck posielajú len boti → predstierame úspech
if (!empty($data['botcheck'])) {
    respond(200, true);
}

$field = function (string $key) use ($data): string {
    $v = $data[$key] ?? '';
    if (!is_string($v)) return '';
    return mb_substr(trim($v), 0, MAX_FIELD_LEN);
};

$email = $field('email');
foreach (['Typ akcie', 'Dátum', 'Miesto', 'Počet detí', 'Meno', 'Telefón', 'GDPR súhlas'] as $required) {
    if ($field($required) === '') {
        respond(422, false);
    }
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false);
}

$order = [
    'Typ akcie', 'Popis inej akcie', 'Dátum', 'Čas', 'Miesto', 'Počet detí',
    'Služby', 'Maskoti', 'Iné požiadavky', 'Meno', 'Telefón', 'email', 'Správa', 'GDPR súhlas',
];
$lines = [];
foreach ($order as $key) {
    $value = $field($key);
    if ($value !== '') {
        $lines[] = "$key: $value";
    }
}
$body = implode("\n", $lines) . "\n";

// Meno a e-mail idú do hlavičiek → odstrániť CR/LF proti header injection
$replyName = preg_replace('/[\r\n]+/', ' ', $field('Meno'));
$replyEmail = preg_replace('/[\r\n]+/', '', $email);

$headers = implode("\r\n", [
    'From: Detičkovo web <' . SENDER . '>',
    'Reply-To: =?UTF-8?B?' . base64_encode($replyName) . "?= <$replyEmail>",
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

$sent = mail(RECIPIENT, '=?UTF-8?B?' . base64_encode(SUBJECT) . '?=', $body, $headers, '-f' . SENDER);
if (!$sent) {
    respond(500, false);
}

$stamps[] = time();
@file_put_contents($rlFile, implode("\n", $stamps));
respond(200, true);
