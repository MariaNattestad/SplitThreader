<!DOCTYPE html>

<html>

<!--    NAVIGATION BAR-->
<?php include "header.html";?>
<?php include "title.html";?>

<div class="panel">
<?php
    $aResult = array();
    if( !isset($_POST['code']) ) { $aResult['error'] = 'ERROR: No code passed to input_validation.php';}
    $code=$_POST["code"];

    // if( !isset($_POST['annotation']) ) { $aResult['error'] = 'ERROR: No annotation passed to input_validation.php';}
    // $annotation=$_POST["annotation"];

    $nickname = "my_sample";

    if( isset($_POST['nickname']) ) {
        $nickname = $_POST['nickname'];

        // Replace all non-alphanumeric characters with underscores
        $nickname = preg_replace('/[^a-zA-Z0-9]/', '_', $nickname);
        $_POST['nickname'] = $nickname;
    }

    $url="analysis.php?code=$code";
    $run_url="run_algorithm.php";
    $filename_variants="user_uploads/$code.variants";
    $filename_copynumber="user_uploads/$code.copynumber";


    $back_button= "<form action=\"./\" method=GET><button type=\"submit\" class=\"center btn btn-danger\">Back</button></form>";
    //$continue_button= "<form action=\"$url\"><input type=\"hidden\" name = \"code\" value=\"$code\"><button type=\"submit\" class=\"center btn btn-success\">Continue</button></form>";
    
    $continue_button= "<form 
        action=\"$run_url\" 
        method=\"post\"><input type=\"hidden\" name = \"code\" value=\"$code\"><input type=\"hidden\" name=\"nickname\" value=\"$nickname\">";
            
            // <input type=\"hidden\" name=\"annotation\" value=\"$annotation\">
            // <input type=\"hidden\" name=\"email\" value=\"$_POST\[\"email\"\]\">
        //     <button type=\"submit\" class=\"center btn btn-success\">Continue</button>
        // </form>";
        
        // <input type=\"hidden\" name=\"read_length\" value=\"$read_length\"> 

    if (!file_exists ($filename_variants) and !file_exists ($filename_copynumber)) {
        echo "<div class=\"alert center alert-danger\" role=\"alert\">No files uploaded</div>";
        echo "$back_button";
        exit;
    }
    else if (!file_exists ($filename_variants)) {
        echo "<div class=\"alert center alert-danger\" role=\"alert\">No file uploaded for variants</div>";
        echo "$back_button";
        exit;
    }
    else if (!file_exists ($filename_copynumber)) {
        echo "<div class=\"alert center alert-danger\" role=\"alert\">No file uploaded for copy number</div>";
        echo "$back_button";
        exit;
    } else {
        echo "<div class=\"alert center alert-success\" role=\"alert\">Great! Both files were uploaded</div>";
        // if(   isset($_POST['min_variant_size']) && isset($_POST['min_split_reads'])   && isset($_POST['annotation'])   ) {
        // $expected_from_POST= array("min_variant_size","min_split_reads","annotation");
        // echo $_POST;
        // foreach ($_POST as $item) {
        //     echo $item;
        //     echo $_POST[$item];
        // }



        // $data = "parameter,val\nmin_variant_size,";
        // foreach ($_POST as $key => $value) {
        //     $data = $data . $key  . "," . $value . "\n";
        //     $continue_button = $continue_button . "<input type=\"hidden\" name = \"" . $key . "\" value=\"" . $value . "\">";
        // }

        $continue_button = $continue_button . "<button type=\"submit\" class=\"center btn btn-success\">Continue</button>
        </form>";

        // $data = "parameter,val\nmin_variant_size," . $_POST['min_variant_size'] . "\n" . "min_split_reads," . $_POST['min_split_reads'] . "\n"  . "annotation," . $_POST['annotation'] . "\n";
        // $ret = file_put_contents('user_uploads/' . $code . '.config', $data, FILE_APPEND | LOCK_EX);
        // if($ret === false) {
        //     die('There was an error writing this file');
        // }
        // }

        echo "$continue_button";
    }
?>

</div>
</body>
</html>
