<html>
    <body>
        
<?php

    if( !isset($_POST['code']) ) { echo shell_exec('echo ERROR: No code passed to run_algorithm.php >> user_data/ERRORS/run_algorithm.log');}
    $code=$_POST["code"];

    if( !isset($_POST['nickname']) ) { echo shell_exec('echo ERROR: No nickname passed to run_algorithm.php >> user_data/$code/run_algorithm.log');}
    $nickname = $_POST["nickname"];

    $url="analysis.php?code=$code";
    $filename="user_uploads/$code";
    $oldmask = umask(0);
    mkdir("user_data/$code");
    umask($oldmask);

    // Run the job:
    echo shell_exec("./bin/web_pipeline $filename.variants $filename.copynumber user_data/$code/$nickname &> user_data/$code/run_algorithm_errors.log &"); 

    // Add cookie:
    function get_client_ip() {
        $ipaddress = '';
        if (getenv('HTTP_CLIENT_IP'))
            $ipaddress = getenv('HTTP_CLIENT_IP');
        else if(getenv('HTTP_X_FORWARDED_FOR'))
            $ipaddress = getenv('HTTP_X_FORWARDED_FOR');
        else if(getenv('HTTP_X_FORWARDED'))
            $ipaddress = getenv('HTTP_X_FORWARDED');
        else if(getenv('HTTP_FORWARDED_FOR'))
            $ipaddress = getenv('HTTP_FORWARDED_FOR');
        else if(getenv('HTTP_FORWARDED'))
           $ipaddress = getenv('HTTP_FORWARDED');
        else if(getenv('REMOTE_ADDR'))
            $ipaddress = getenv('REMOTE_ADDR');
        else
            $ipaddress = 'UNKNOWN';
        return $ipaddress;
    }

    $new_dataset = array( "date"=>time(), "codename"=>$code, "description"=> $nickname, "ip"=>get_client_ip() );

    $my_datasets = array();
    if(isset($_COOKIE["splitthreader"])) {
      // echo "splitthreader cookie is already there, adding to it.";
      $my_datasets = json_decode($_COOKIE["splitthreader"], true);
    } else {
      // echo "cookie not set, creating new one";
    }
    array_push($my_datasets, $new_dataset);
    setcookie("splitthreader", json_encode($my_datasets));

    $header = array("date","codename","description","ip");

    $header_length = count($header);
    $myfile = fopen("user_data/$code/cookies.log", "w");
    for ($i = 0; $i < $header_length-1; $i++) {
        fwrite($myfile, $header[$i] . ",");
    }
    fwrite($myfile, "" . $header[$header_length-1] . "\n"); // avoid a comma at the end of the line
    $arrlength = count($my_datasets);
    for($x = 0; $x < $arrlength; $x++) {
        $row = $my_datasets[$x];
        for ($i = 0; $i < $header_length-1; $i++) {
            fwrite($myfile,"" . $row[$header[$i]] . ",");
        }
        fwrite($myfile,"" . $row[$header[$header_length -1]] . "\n");
    }
    fclose($myfile);


    // Go to the results page to see progress:
    header('Location: '.$url);
?>
    </body>
</html>

<!-- <form name="input_code_form" action="run.php" id="analysis_form" method="post"> -->
