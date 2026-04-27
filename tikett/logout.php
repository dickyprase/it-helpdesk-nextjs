<?php
require_once 'function.php';
api_logout();
header('Location: login.php');
exit;
