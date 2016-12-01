<!DOCTYPE html>

<html>


<!--    NAVIGATION BAR-->
    <?php include "header.html";?>

    <link href="css/custom_styles.css" rel="stylesheet">

    <!-- <link rel="stylesheet" type="text/css" media="screen" href="http://cdnjs.cloudflare.com/ajax/libs/fancybox/1.3.4/jquery.fancybox-1.3.4.css" /> -->



    <!-- ////////////////////////////////////////////////// -->
    <!-- ////////////////      RESULTS     //////////////// -->
    <!-- ////////////////////////////////////////////////// -->
    
     <!--  HEADER -->
    <div class="thumbnail frame">
        <div class = "caption" style="text-align: center"><h3 id="nickname_header"></h3></div>
    </div>

    
    <div id="results">
            <div class=" thumbnail plot_frame frame">

                <!--  SHOW VISUALIZER BUTTON  -->
                <form name="show_visualizer" id="show_visualizer" action="vis.php"  method="get">
                    <p id="hidden_fields_and_submit">
                    <!-- add hidden fields for code and nickname, as well as submit button from analysis_page_script.js-->
                    </p>
                </form>
            
            </div> 
            <!-- End of frame -->

            
        
    </div>
           
    <!--View analysis later-->
    <div id="codepanel" >
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">View analysis later</h3>
          </div>
          <div id="code" class="panel-body">
            <?php
                $code=$_GET["code"];
                $url="http://splitthreader.com/analysis.php?code=$code";
    
                echo "Return to view your results at any time: <input type=\"text\" class=\"form-control\" value=\"$url\"></input>";
            ?>
          </div>
        </div>
    </div>

    <!-- ////////////////////////////////////////////////// -->
    <!-- /////////////      Progress info     ///////////// -->
    <!-- ////////////////////////////////////////////////// -->
    <div class="panel panel-default center" id="progress_panel">
      <div class="panel-heading">
        <h3 class="panel-title">Progress</h3>
      </div>
      <div class="panel-body">
        <div id="plot_info">
        Checking progress...
        </div>
      </div>
    </div> <!-- End of progress info -->
    <!-- ////////////////////////////////////////////////// -->
    


    
<!--   jquery must be first because bootstrap depends on it   -->
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>

<script type='text/javascript' src="js/analysis_page_script.js"> ></script>

</body>
</html>




