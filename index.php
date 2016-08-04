<!DOCTYPE html>

<html>

<!--    NAVIGATION BAR-->
<?php include "header.html";?>
<?php include "title.html";?>

<!--INSTRUCTIONS-->
  <div class="row">
          <div class="col-md-7">
                  <div class="panel panel-default">
                          <div class="panel-heading"> <h3 class="panel-title">Run SplitThreader</h3></div>
                          <div class="panel-body">
                              <div class="row">
                                <div class="col-sm-6">
                                    <h3> Variant calls</h3>
                                    <!--    DROPZONE   -->
                                    <div class="frame">
                                        <form action="file_upload.php"
                                            class="dropzone"
                                            id="VariantsDropzone">
                                            <input class="code_keeper" type="hidden" name="code_hidden" value="">
                                            <input type="hidden" name="file_type" value="variants">
                                        </form>
                                    </div>
                                    <!--   end of DROPZONE   -->
                                </div>
                                <div class="col-sm-6">
                                    <h3> Copy number profile</h3>
                                    <!--    DROPZONE   -->
                                    <div class="frame"> 
                                        <form action="file_upload.php"
                                            class="dropzone"
                                            id="CopyNumberDropzone">

                                            <input class="code_keeper" type="hidden" name="code_hidden" value="">
                                            <input type="hidden" name="file_type" value="copynumber">
                                        </form>
                                    </div>
                                    <!--   end of DROPZONE   -->
                                </div>
                              </div> 
                              <!-- end of row containing 2 dropzones -->

                                  <div class="frame"> 
                                      <!--    SUBMIT BUTTON with hidden field to transport code to next page   -->
                                      <form name="input_code_form" action="input_validation.php"  method="post">
                                            <!-- DESCRIPTION -->
                                            <p>
                                              <div class="input-group input-group-lg">
                                                <span class="input-group-addon">Description</span>
                                                 <input type="text" name="nickname" class="form-control" placeholder = "description of dataset, cell line, data type, etc.">
                                              </div>
                                            </p>
                                            <p id="analysis_form">
                                          <!--  submit button set from within front_page_script.js --> 
                                            </p>
                                      </form>
                                  </div>
                          </div>
                  </div>
          </div>
          <div class="col-md-5"> 
                  <div class="panel panel-default">
                      <div class="panel-heading"> <h3 class="panel-title">Instructions</h3></div>
                      <div class="panel-body">
                        <p>Upload variant calls and a copy number profile</p>
                        <ol>
                          <li>Run <a href="https://github.com/fritzsedlazeck/Sniffles">Sniffles</a> (for PacBio data) or <a href="https://github.com/arq5x/lumpy-sv">Lumpy</a> (for Illumina data, select output as bedpe format) and upload the .bedpe file. VCF files are supported, but do not always include the necessary information such as strand and number of reads, so some information may be missing. The script parses your file based on the format of VCF files from Manta, Delly, and Lumpy, and in some cases has to guess the strands from the variant types and other flags specific to each variant-caller's output. </li>
                          <li>Run <a href="https://github.com/marianattestad/copycat">Copycat</a> on your bam file to convert to binned copy numbers, and upload the resulting .csv file</li>
                        </ol>
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
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>

<script src="js/front_page_script.js"></script>
<script src="js/lib/dropzone.js"></script>
   
<script type="text/javascript">

var copynumber_done = false;
var variants_done = false;

Dropzone.options.CopyNumberDropzone = {
  accept: function(file, done) {
    console.log("uploaded");
    done();
  },
  init: function() {
    this.on("addedfile", function() {
      console.log("file added");
      if (this.files[1]!=null){
        this.removeFile(this.files[0]);
      }
      $("#submit_button").prop("disabled",true);
      copynumber_done = false;
    });
    this.on("complete", function (file) {
        if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
          console.log("uploaded");
          copynumber_done = true;
          check_if_both_done();
        }
    });
  }
};  

Dropzone.options.VariantsDropzone = {
  accept: function(file, done) {
    console.log("uploading");
    done();
  },
  init: function() {
    this.on("addedfile", function() {
      console.log("file added");
      if (this.files[1]!=null){
        this.removeFile(this.files[0]);
      }
      $("#submit_button").prop("disabled",true);
        variants_done = false;
    });
      this.on("complete", function (file) {
        if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
          console.log("uploaded");
          variants_done = true;
          check_if_both_done();
        }
    });
  }
};

function check_if_both_done() {
  if (copynumber_done==true && variants_done==true) {
    console.log("both done");
    $("#submit_button").prop("disabled",false);
  }
}

</script>
</body>
</html>
