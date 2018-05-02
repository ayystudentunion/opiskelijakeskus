<?php
    if (isset($_POST['file_path']) && isset($_POST['data'])) {
        function save_new_idea($file_path, $data) {
            // Get the file's content
            $lines = file($file_to_read , FILE_IGNORE_NEW_LINES);

            // Update the new times
            file_put_contents($file_path , $data);
        }

        save_new_idea($_POST['file_path'], $_POST['data']);
    }
?>