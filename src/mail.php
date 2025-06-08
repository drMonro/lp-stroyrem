<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Получение переменных из .env
$hCaptchaSecret = $_ENV['HCAPTCHA_SECRET'] ?? '';

// Получение токена с фронта
$hCaptchaResponse = $_POST['h-captcha-response'] ?? '';

// ===== ✅ Обработка фиктивного токена session-pass =====
if ($hCaptchaResponse !== 'session-pass') {
    $verify = file_get_contents("https://hcaptcha.com/siteverify?secret=$hCaptchaSecret&response=$hCaptchaResponse");
    $captchaSuccess = json_decode($verify);

    // Если не success — капча не пройдена
    if (!($captchaSuccess->success ?? false)) {
        http_response_code(403);
        exit("hCaptcha verification failed.");
    }
} else {
    // Можно логировать или игнорировать, капча считается уже пройденной
    error_log("hCaptcha bypassed via session-pass");
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
$html = '';
$alternate = true;

foreach ($data as $key => $value) {
    if (in_array($key, ['project_name', 'admin_email', 'form_subject', 'h-captcha-response']) || $value === '') {
        continue;
    }

    $key_safe = htmlspecialchars($key, ENT_QUOTES, 'UTF-8');
    $value_safe = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    $style = $alternate ? '' : ' style="background-color: #f8f8f8;"';

    $html .= "<tr$style>
                  <td style=\"padding: 10px; border: #e9e9e9 1px solid;\"><b>$key_safe</b></td>
                  <td style=\"padding: 10px; border: #e9e9e9 1px solid;\">$value_safe</td>
              </tr>";

    $alternate = !$alternate;
}

$html = "<table style=\"width: 100%;\">$html</table>";

// --- multipart/alternative body ---
$boundary = uniqid('np');

$text_body = "Вы получили письмо с формы сайта \"$project_name\".\nПисьмо в HTML-формате. Откройте его в поддерживаемом почтовом клиенте.";

$body = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$body .= $text_body . "\r\n\r\n";

$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$body .= $html . "\r\n\r\n";
$body .= "--$boundary--";

// --- Заголовки письма ---
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=$boundary\r\n";
function adopt(string $text): string {
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}
$headers .= 'From: ' . adopt($project_name) . " <$admin_email>\r\n";
$headers .= "Reply-To: $admin_email\r\n";

// --- Отправка ---
mail($admin_email, adopt($form_subject), $body, $headers, "-f$admin_email");
