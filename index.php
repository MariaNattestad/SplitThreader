<!DOCTYPE html>

<html>

<!--    NAVIGATION BAR-->
<?php include "header.html";?>
<?php include "title.html";?>

<!--INSTRUCTIONS-->
  <div class="row">
          <div class="col-lg-7"> 
                  <div class="panel panel-default">
                          <div class="panel-heading"> <h3 class="panel-title">Run SplitThreader</h3></div>
                          <div class="panel-body">
                              <div class="row">
                                <div class="col-lg-6">
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
                                <div class="col-lg-6">
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
                                            <p>
                                              <div class="input-group input-group-lg">
                                                <span class="input-group-addon">Description</span>
                                                 <input type="text" name="nickname" class="form-control" value = "description of dataset, cell line, data type, etc. ">
                                              </div>
                                            </p>

                                            <!-- BUTTON FOR OPTIONAL PARAMETERS -->
                                            <p><a class="btn btn-default" data-toggle="collapse" href="#collapseExample" aria-haspopup="true" aria-expanded="false" aria-controls="collapseExample">
                                                <span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span> Optional parameters
                                                <!-- http://glyphicons.com/ -->
                                            </a></p>
                                            <!-- Collapsible area containing optional parameters -->
                                                <div class="collapse" id="collapseExample">
                                                    <div class=" thumbnail plot_frame frame">
                                                        <div class="card card-block">
                                                              <table class="table" id="config_table" style="display: table;">
                                                                  <tr class="active">
                                                                      <th colspan="2">Variant filtering</th></tr>
                                                                  <tr>
                                                                      <td><label for="min_variant_size" class="form-control-label" >Minimum variant size</label></td>
                                                                      <td><input name="min_variant_size" id="min_variant_size" type="number" step="1" min="0" class="form-control" value = "0"></td>
                                                                  </tr>
                                                                  <tr>
                                                                      <td><label for="min_split_reads" class="form-control-label">Minimum split reads supporting variant</label></td>
                                                                      <td><input name="min_split_reads" id="min_split_reads" type="number" step="1" min="0" class="form-control" value = "0"></td>
                                                                  </tr>
                                                                  <tr class="active">
                                                                      <th colspan="2">Annotation</th></tr>
                                                                  <tr>
                                                                    <td colspan="2">                                                                      
                                                                          <div class="radio"><label><input type="radio" checked name="annotation" value=""> None </label></div>
                                                                          <?php $filenames = glob("resources/annotation/*.genes.csv"); foreach ($filenames as $value) {$output=str_replace("resources/annotation/","",$value); $output=str_replace(".genes.csv","",$output); echo '<div class="radio"><label><input type="radio" name="annotation" value="' . $value .'"> ' . $output. ' (Gencode) </label></div>';}; ?>
                                                                    </td>
                                                                  </tr>
                                                              </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            <!-- End of collapse area -->
                                            
                                            <p id="analysis_form">
                                          <!--  submit button set from within front_page_script.js --> 
                                            </p>
                                      </form>
                                  </div>
                          </div>
                  </div>
          </div>
          <div class="col-lg-5"> 
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

console.log("in bottom javascript");

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
    });
  }
};  

Dropzone.options.VariantsDropzone = {
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
    });
  }
};

</script>
</body>
</html>
