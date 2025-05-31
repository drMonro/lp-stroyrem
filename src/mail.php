<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Получение переменных из .env
$hCaptchaSecret = $_ENV['HCAPTCHA_SECRET'] ?? '';

$hCaptchaResponse = $_POST['h-captcha-response'] ?? '';

error_log("h-captcha-response: ");

$verify = file_get_contents("https://hcaptcha.com/siteverify?secret=$hCaptchaSecret&response=$hCaptchaResponse");
$captchaSuccess = json_decode($verify);

// Далее ваша логика обработки результата
if (!($captchaSuccess->success ?? false)) {
    http_response_code(403);
    exit("hCaptcha verification failed.");
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    exit("Only POST requests are allowed.");
}

$data = $_POST;

// Проверка обязательных полей
$admin_email = $_ENV['ADMIN_EMAIL'] ?? '';
$project_name = trim($data["project_name"] ?? '');
$form_subject = trim($data["form_subject"] ?? '');

if (!$project_name || !$admin_email || !$form_subject) {
    http_response_code(400);
    exit("Missing required fields.");
}

// Формирование HTML-сообщения
$message = '';
$alternate = true;

foreach ($data as $key => $value) {
    if (in_array($key, ['project_name', 'admin_email', 'form_subject', 'h-captcha-response']) || $value === '') {
        continue;
    }

    $key_safe = htmlspecialchars($key, ENT_QUOTES, 'UTF-8');
    $value_safe = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    $style = $alternate ? '' : ' style="background-color: #f8f8f8;"';

    $message .= "<tr$style>
                     <td style='padding: 10px; border: #e9e9e9 1px solid;'><b>$key_safe</b></td>
                     <td style='padding: 10px; border: #e9e9e9 1px solid;'>$value_safe</td>
                 </tr>";

    $alternate = !$alternate;
}

$message = "<table style='width: 100%;'>$message</table>";

// Кодировка заголовков письма
function adopt(string $text): string {
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

// Заголовки письма
$headers = "MIME-Version: 1.0" . PHP_EOL .
    "Content-Type: text/html; charset=utf-8" . PHP_EOL .
    'From: ' . adopt($project_name) . ' <' . $admin_email . '>' . PHP_EOL .
    'Reply-To: ' . $admin_email . PHP_EOL;

// Отправка письма
mail($admin_email, adopt($form_subject), $message, $headers);
