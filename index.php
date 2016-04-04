<!DOCTYPE html>

<html>

<!--    NAVIGATION BAR-->
<?php include "header.html";?>
<?php include "title.html";?>

<!--INSTRUCTIONS-->
  <div class="row">
          <div class="col-lg-7"> 
                  <div class="panel panel-default">
                      <div class="panel-heading"> <h3 class="panel-title">Instructions</h3></div>
                      <div class="panel-body">
                        <p>Upload variant calls and a copy number profile</p>
                        <ol>
                          <li>Run Sniffles (for PacBio data) or Lumpy (for Illumina data, select output as bedpe format) and upload the .bedpe file</li>
                          <li>Run this script [to be created] on your bam file to convert to binned copy numbers, and upload the resulting .csv file</li>
                        </ol>
                      </div>
                  </div>
          </div>
          <div class="col-lg-5"> 
                  <div class="panel panel-default">
                          <div class="panel-heading"> <h3 class="panel-title">Run SplitThreader</h3></div>
                          <div class="panel-body">
                                    <h3>Variant calls</h3>
                                  	<!--    DROPZONE   -->
                                  	<div class="frame"> 
                                      	<form action="file_upload.php"
                                      	    class="dropzone"
                                      	    id="variants_dropzone">
                                      	    <input class="code_keeper" type="hidden" name="code_hidden" value="">
                                            <input type="hidden" name="file_type" value="variants">
                                      	</form>
                                  	</div>
                                    <!--   end of DROPZONE   -->
                                    <br>
                                    <h3>Copy number profile</h3>
                                    <!--    DROPZONE   -->
                                    <div class="frame"> 
                                        <form action="file_upload.php"
                                            class="dropzone"
                                            id="copynumber_dropzone">
                                            <input class="code_keeper" type="hidden" name="code_hidden" value="">
                                            <input type="hidden" name="file_type" value="copynumber">
                                        </form>
                                    </div>
                                    <!--   end of DROPZONE   -->
                                  <br>

                                  <div class="frame"> 
                                      <!--    SUBMIT BUTTON with hidden field to transport code to next page   -->
                                      <form name="input_code_form" action="input_validation.php"  method="post">
                                            <p>
                                              <div class="input-group input-group-lg">
                                                <span class="input-group-addon">Description</span>
                                                 <input type="text" name="nickname" class="form-control" value = "description of dataset, cell line, data type, etc. ">
                                              </div>
                                            </p>
                                            <!-- <p>
                                              <div class="input-group input-group-lg">
                                                <span class="input-group-addon">Unique sequence length required</span>
                                                 <input type="number" max="100000" step="1000" min="1000" name="uniqlength" class="form-control" value = "10000">
                                              </div>
                                            </p> -->

                                            <!-- <p>
                                              <div class="input-group input-group-lg">
                                                <span class="input-group-addon">Read length</span>
                                                 <input type="number" step="1" name="read_length" class="form-control" value = "100">
                                              </div>
                                            </p> -->
                                            <p id="analysis_form">
                                          <!--  submit button set from within front_page_script.js --> 
                                            </p>
                                      </form>
                                  </div>
                          </div>
                  </div>
          </div>
  </div>
<!-- </div> -->



<!--View analysis later-->
<div id="codepanel">
    <div class="panel panel-default">
      <div class="panel-heading"><h3 class="panel-title">View analysis later</h3></div>
      <div id="code" class="panel-body">
         <!-- contents set from within front_page_script.js  -->
      </div>

    </div>
</div> 

<!--scripts at the end of the file so they don't slow down the html loading-->

<!--   jquery must be first because bootstrap depends on it   -->
<script src="js/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>

<script src="js/front_page_script.js"></script>
<script src="js/dropzone.js"></script>

   

<script type="text/javascript">
Dropzone.options.myAwesomeDropzone = {
  accept: function(file, done) {
    console.log("uploaded");
    done();
  },
  init: function() {
    this.on("addedfile", function() {
      if (this.files[1]!=null){
        this.removeFile(this.files[0]);
      }
    });
  }
};  

</script>
</body>
</html>
