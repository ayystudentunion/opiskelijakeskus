<?php
    if (isset($_POST['file_path']) && isset($_POST['data'])) {
        function save_data($file_path, $data) {
            $handle = fopen($file_path, 'r+');

            // Lock file to prevent data from getting fucked
            if (flock($handle, LOCK_EX)) {
                fwrite($handle, $data);
                flock($handle, LOCK_UN);
            }

            fclose($handle);
        }

        save_data($_POST['file_path'], $_POST['data']);
    }
?>