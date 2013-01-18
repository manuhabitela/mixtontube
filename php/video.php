<?php 
require_once '../vendor/fg/essence/lib/bootstrap.php';

$essence = new fg\Essence\Essence();

if (!empty($_GET['url'])) {
	$url = filter_input(INPUT_GET, 'url', FILTER_SANITIZE_URL);
	$extracted = $essence->extract($url);
	if (!empty($extracted)) {
		$video = $essence->embed($extracted[0]);
		if ($video) {
			echo json_encode($video->properties());
		}
	}
}