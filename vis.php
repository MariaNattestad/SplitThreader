<!DOCTYPE html>

<html>


<!--    NAVIGATION BAR-->
<?php include "header.html";?>

<link href="css/splitthreader_visualizer.css" rel="stylesheet">
<link href="css/d3-livesearch.css" rel="stylesheet">
<link href="css/d3-superTable.css" rel="stylesheet">

<h1 id="title"></h1>
<div id="main_body_container">
	<ul class="nav nav-tabs">
		<li class="active"><a data-toggle="tab" href="#visualizer_tab">Visualizer</a></li>
		<li><a data-toggle="tab" href="#variant_analysis_tab">Variant analysis</a></li>	
	</ul>

	<div class="tab-content">
	<!-- Variant settings -->
		<div id="visualizer_tab" class="tab-pane fade in active">
			<div id="svg_landing"></div>

			<div id="right_panel">
				
				<div id="user_message" class="alert alert-default" role="alert"></div>

				<div class="panel-group ">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								<a data-toggle="collapse" class="active" href="#settings_panel">Tools</a>
							</h4>
						</div>
						<div class="panel-collapse collapse in" id="settings_panel">
							<div class="panel-body">
								<ul class="nav nav-tabs">
									<li class="active"><a data-toggle="tab" href="#gene_settings">Genes</a></li>
									<li><a data-toggle="tab" href="#gene_fusions">Fusions</a></li>
									<li><a data-toggle="tab" href="#variant_settings">Variants</a></li>
									<li><a data-toggle="tab" href="#explore_tab">Explore</a></li>
									<li><a data-toggle="tab" href="#settings">Settings</a></li>
								</ul>

								<div class="tab-content">
								<!-- Gene settings -->
									<div id="gene_settings" class="tab-pane fade in active">
										<label for="color_scheme_dropdown">Annotation:</label>
										<select class="form-control" id="annotation_dropdown">
										</select>

										<div id="show_genes_box">
											<label>Label genes:</label>
											<div id="gene_livesearch"></div>
											<label>Genes labeled:</label> (click to show/hide)
											<div>
											   <ul id="genes_labeled" class="gene_list"></ul>
											</div>
										</div>
										<!-- <div>
											<h4> Top genes:</h4>
											<ul id="top_local_genes" class="gene_list"></ul>
										</div>
										<div>
											<h4>Bottom genes:</h4>
											<ul id="bottom_local_genes" class="gene_list"></ul>
										</div> -->
										<div id="gene_type_table_box">
											<table id="gene_type_table"></table>
										</div>
										<div class="checkbox">
											<label><input id="hide_local_gene_names" type="checkbox">Hide gene names for types selected in table above</label>
										</div>
									</div>

								<!-- Gene fusions -->

									<div id="gene_fusions" class="tab-pane fade">
											<div id="gene_fusion_input">
												<div class="gene_search_box">
													Gene 1
													<div id="fusion_gene1_livesearch"></div>
												</div>
												<div class="gene_search_box">
													Gene 2
													<div id="fusion_gene2_livesearch"></div>
												</div>
												<div class="row">
													<div class="gene_search_box">
													Selected: <span id="gene1">(none)</span>
													</div>

													<div class="gene_search_box">
													Selected: <span id="gene2">(none)</span>
													</div>
													<button id="submit_fusion">Submit</button>
												</div>
											</div>
												
											<!-- <table id="gene_fusion_table">
												<tr id="input_row">
													<td width="20%" id="gene1">search gene above</td>
													<td width="20%" id="gene2">search gene above</td>
													<td width="60%"> <button id="submit_fusion">Submit</button></td>
												</tr>
											</table> -->
											<div id="gene_fusion_table_landing">

											</div>

											<!-- <table id="gene_fusion_table_results">
												
											</table> -->
											Submit a possible gene fusion to query the SplitThreader graph for the shortest genomic connection between the two gene locations, then click a row in the table to jump to that gene fusion.
											<form id="send_fusion_to_ribbon_form" method="post" target="_blank">
													<div id="fusion_data_to_send_ribbon">
														<!-- Hidden fields go here -->
													</div>
													<input type="submit" value="Send fusion variants to Ribbon">	
												</form>
											<hr>
											<div>
												<p>or upload a list of gene fusions</p>
												<input type="file" id="gene_fusion_file" />
												<span id="gene_fusion_file_icon" ><span class="glyphicon glyphicon-info-sign"></span>Instructions
												</span>
											</div>
									</div>

								<!-- Variants -->
								<div id="variant_settings" class="tab-pane fade">
									<label>Filter variants:</label>
									<table id="variant_table"></table>
									<hr>
									<label>Variant details:</label>
									<div id="variant_detail_text">Click on a variant to show detail</div>

								</div>
								<!-- Settings -->
									<div id="settings" class="tab-pane fade">
										<table class="settings_table">
											<col width="50%">
											<col width="50%">
											<tr>
												<td>Show segmented coverage:</td>
												<td><input id="show_segmented_coverage" type="checkbox"></td>
											</tr>
											<tr>
												<td>Divide coverage by:</td>
												<td><input id="coverage_divisor" type="number" value="1"></td>
											</tr>
											<tr>
												<td><label for="color_scheme_dropdown">Color scheme:</label></td>
												<td><select class="form-control" id="color_scheme_dropdown"></select></td>
											</tr>
											<tr>
												<td>Minimum variant size: </td>
												<td><input id="min_variant_size" type="number"></td>
											</tr>
											<tr>
												<td>Minimum split reads:</td>
												<td><input id="min_split_reads" type="number"></td>
											</tr>
										</table>
									</div>

									<!-- Explore -->
									<div id="explore_tab" class="tab-pane fade">
										<p><label>Send to UCSC genome browser</label></p>
										<p>Database: <span id="ucsc_database">hg19 </span></p>
										<p><a id="ucsc_go_top" target="_blank"  >Top: <span id="top_position"></span></a></p>
										<p><a id="ucsc_go_bottom" target="_blank" >Bottom: <span id="bottom_position"></span></a></p>
										<p>(change database in Genes tab under annotation)</p>

										<hr>

										<p><label>Send to Ribbon long-read browser</label></p>
										<div id="send_to_ribbon_panel">
											<p>Ribbon (<a href="http://genomeribbon.com">genomeribbon.com</a>) is a long-read alignment viewer that allows you to see all the reads mapping near a variant including their other alignments across the genome, and you can see detailed alignments for each read to determine which parts of the read are mapping where.</p>
											<form id="send_to_ribbon_form" method="post" target="_blank">
												<div id="data_to_send_ribbon">
													<!-- Hidden fields go here -->
												</div>
												<label>Ribbon path: <input id='ribbon_path'></label>
												<input type="submit" value="Send all variants to Ribbon">	
											</form>
										</div>

									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div> <!-- end of right panel -->
		</div> <!-- end of visualizer tab -->
		

		<div id="variant_analysis_tab" class="tab-pane fade">
		Showing 10 variants. Filter in text boxes by =,>, or <, and click column names to sort.
		<div id="variant_table_landing">

		</div>
		</div> <!-- end variant analysis tab -->

	</div> <!-- end tab content class -->
</div> <!-- end of main body container -->




<script src="js/lib/d3.v3.min.js"></script>
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>
<script src="js/lib/priority-queue.min.js"></script>

<script src="js/d3-superTable.js"></script>
<script src="js/d3-livesearch.js"></script>

<script src="js/SplitThreader.js"></script>
<script src="js/SplitThreader_visualizer.js"></script>





