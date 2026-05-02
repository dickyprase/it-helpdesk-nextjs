<?php
require_once '../config/function.php';
logout();
header('Location: ' . getBaseUrl() . 'login/');
exit;
