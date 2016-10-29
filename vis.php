<!DOCTYPE html>

<html>


<!--    NAVIGATION BAR-->
<?php include "header.html";?>

<link href="css/splitthreader_visualizer.css" rel="stylesheet">
<link href="css/d3-livesearch.css" rel="stylesheet">
<link href="css/d3-superTable.css" rel="stylesheet">

<div class="row">
	<div class="col-md-8">
		<h1 id="title"></h1>
	</div>
	<div class="col-md-4">
		<div id="user_message" class="alert alert-default" role="alert"></div>
	</div>
</div>
<div id="main_body_container">
	<ul class="nav nav-tabs">
		<li class="active"><a data-toggle="tab" href="#visualizer_tab">Visualizer</a></li>
		<li><a data-toggle="tab" href="#variant_analysis_tab">Variant analysis</a></li>	
		<li><a data-toggle="tab" href="#gene_fusions_tab">Gene fusions</a></li>
		<li><a data-toggle="tab" href="#feature_search_tab">Graph search</a></li>
		<li><a data-toggle="tab" href="#help_tab">Help</a></li>
	</ul>

	<div class="tab-content">
	<!-- Variant settings -->
		<div id="visualizer_tab" class="tab-pane fade in active">
			<div id="svg_landing"></div>

			<div id="right_panel">
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
										
										<div id="gene_type_table_box">
											<table id="gene_type_table"></table>
										</div>
										<div class="checkbox">
											<label><input id="hide_local_gene_names" type="checkbox">Hide gene names for types selected in table above</label>
										</div>
									</div>

								<!-- Variants -->
								<div id="variant_settings" class="tab-pane fade">
									<label>Filter variants:</label>
									<table id="variant_type_table"></table>
									<hr>
									<label>Variant details:</label>
									<div id="variant_detail_text">Click on a variant to show detail</div>
									<div id="variant_detail_landing"></div>

								</div>
								<!-- Settings -->
									<div id="settings" class="tab-pane fade">
										<table class="settings_table">
											<col width="50%">
											<col width="50%">
											<tr>
												<td>Show segmented coverage:</td>
												<td><input id="show_segmented_coverage" type="checkbox" checked></td>
											</tr>
											<tr>
												<td>Divide coverage by:</td>
												<td><input id="coverage_divisor" type="number" value="1"></td>
											</tr>
											<tr class="only_when_features">
												<td>Show features</td>
												<td><input id="show_features" type="checkbox" checked></td>
											</tr>
											<tr>
												<td><label for="color_scheme_dropdown">Color scheme:</label></td>
												<td><select class="form-control" id="color_scheme_dropdown"></select></td>
											</tr>
											<tr>
												<td>Publication style plot</td>
												<td><input id="publication_style_plot_checkbox" type="checkbox" ></td>
											</tr>
											<tr>
												<td>
													<button id="take_screenshot">Download screenshot</button>
												</td>
											</tr>
											<tr><td colspan="2"><hr><label>Filter variants:</label></td></tr>
											<tr>
												<td>Minimum variant size: </td>
												<td><input id="min_variant_size" type="number"></td>
											</tr>
											<tr>
												<td>Minimum split reads:</td>
												<td><input id="min_split_reads" type="number"></td>
											</tr>
											<tr><td colspan="2"><hr><label>Downloads:</label></td></tr>
											<tr>
												<td colspan="2"><a id="download_coverage_data" download>Download coverage data (.csv)</a></td>
											</tr>
											<tr>
												<td colspan="2"><a id="download_variant_data" download>Download variant data (.csv)</a></td>
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
												<input class="btn btn-primary" type="submit" value="Send all variants to Ribbon">
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
			<div class="row">
	          	<div class="col-md-5">
					<svg id="histogram_landing"></svg>
				</div>
				<div class="col-md-2">
					<div id="statistics_landing">
						<p><label>Average segmented copy number: </label><span id="mean_copynumber"></span></p>
						<p><label>Total number of variants: </label><span class="number_of_variants"></span></p>
						<p><label>Number of variants after filtering in table below: </label> <span class="filtered_number_of_variants"></span></p>
					</div>
				</div>
				
				<div class="col-md-5">
					<div id="variant_category_tables_landing">
						<!-- <table id="variant_category_table"></table> -->
					</div>
				</div>
			</div> <!-- end of row -->
			<p>Showing <span id="table_row_count"></span> variants out of <span class="filtered_number_of_variants"></span>. Unfiltered, there are <span class="number_of_variants"></span> variants</p>
			<p>Filter in text boxes by =,>, or <, and click column names to sort. Click on a row in the table to see that variant in the visualizer</p>
			<div class="table_landing" id="variant_table_landing"></div>

			<div id="table_export_buttons">
				<a class="btn btn-info" id="export_variant_table_to_csv">Export table as csv</a>

				<form id="send_filtered_table_to_ribbon_form" method="post" target="_blank">
					<div id="filtered_data_to_send_ribbon">
						<!-- Hidden fields go here -->
					</div>
					<input class="btn btn-primary" type="submit" value="Send all variants to Ribbon">	
				</form>
			</div>

		</div> <!-- end variant analysis tab -->

		<!-- Gene fusions -->

		<div id="gene_fusions_tab" class="tab-pane fade">

			<div class="alert alert-info" role="alert">
				Enter gene names by hand or upload a list, and SplitThreader will use its rearrangement graph to search for genomic connections between each pair of genes. 
			</div>
			<div class="row">
				<div class="col-md-6">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								Enter gene names
							</h4>
						</div>
						<div class="panel-body">
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
							<label>Instructions:</label>
							<p>
								Start typing a gene name into the input box and click on the gene you want (or use the arrow genes to walk up and down the list and press enter on the gene you want). Select two genes and then click the Submit button to search the rearrangement graph for a connection between the two genes. 
							</p>
						</div>
					</div>
					
				</div>
				<div class="col-md-6">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								Upload a list
							</h4>
						</div>
						<div class="panel-body">
							<p>Upload a list of gene fusions</p>
							<input type="file" id="gene_fusion_file" />
							<hr>
							<label>Instructions:</label>
							<p>
								The file should have a pair of genes on each line separated by tabs, commas, or spaces, with the gene names in the first two columns matching the annotation.
							</p>
						</div>
					</div>
				</div>
			</div> <!-- end of row -->
			<div id="show_when_fusions_submitted">
				<div class="panel panel-default">
					<div class="panel-heading">
						<h4 class="panel-title">
							Shortest paths found:
						</h4>
					</div>
					<div class="panel-body">
						
						<div class="table_landing" id="gene_fusion_table_landing"></div>
						<label>Instructions:</label>
						<p>
							Click on a row in the table to jump to each gene fusion in the visualizer.
							"distance" is the number of basepairs in the path between the two genes. "num_variants" indicates the number of variants this path threads through in the graph. "path_chromosomes" shows all the chromosomes found along the path. 
							If the genes have a direct connection that intersects both genes, the distance will be 0, num_variants will be 1, and path_chromosomes will be only the chromosomes the genes themselves reside on. 
						</p>
						<label>Export gene fusions</label>
						<p>
							<a class="btn btn-info" id="export_gene_fusions_to_csv">Export table as csv</a>
						</p>
						<p>
							<label>Send to Ribbon to visualize alignments</label>
						</p>
						<p>
							<form id="send_fusion_to_ribbon_form" method="post" target="_blank">
								<div id="fusion_data_to_send_ribbon">
									<!-- Hidden fields go here -->
								</div>
								<input class="btn btn-primary" type="submit" value="Send fusion variants to Ribbon">	
							</form>
						</p>
					</div>
				</div>
			</div>
		</div> <!-- end of gene fusions tab -->
		<div id="feature_search_tab" class="tab-pane fade">
			<div class="row">
	          	<div class="col-md-6">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								From
							</h4>
						</div>
						<div class="panel-body">
							<label class="radio-inline">
								<input type="radio" name="search_from" value="genes">Genes
							</label>
							<label class="radio-inline">
								<input type="radio" name="search_from" value="features">Bed file
							</label>
							<p>Number of starting points: <span id="search_from_item_count"></span></p>
							<div class="table_landing" id="search_from_table_landing">

							</div>
						</div>
					</div>
				</div>
				<div class="col-md-6">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								To
							</h4>
						</div>
						<div class="panel-body">
							<label class="radio-inline">
								<input type="radio" name="search_to" value="genes">Genes
							</label>
							<label class="radio-inline">
								<input type="radio" name="search_to" value="features">Bed file
							</label>
							<p>Number of target end-points: <span id="search_to_item_count"></span></p>
							<div class="table_landing" id="search_to_table_landing">
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="row">
	          	<div class="col-md-6">
					<div class="panel panel-default">
						<div class="panel-heading">
							<h4 class="panel-title">
								Calculate distances across the graph
							</h4>
						</div>
						<div class="panel-body">
							<button id="graph_search_button">Calculate</button>
							<hr>
							<label>Instructions:</label>
							<p>
								Use the tables in the "From" and "To" panels above to filter down to the intervals you want to search between. Then click "Calculate" to get a result for each interval in "From", finding its closest interval among all the possible intervals in the "To" table.
							</p>
							<div class="show_after_graph_search">
								<p>
									Click on one of the results in the table to show the path in the visualizer. 
								</p>
								<p>
									Found results for <span id="froms_matched_count">X</span> out of <span id="total_froms_count">N</span> total intervals in the "From" table. Showing at most 30, but filter and sort works on the whole set (as with all tables in SplitThreader). 
								</p>

								<!-- Export options -->
								<label>Export gene fusions</label>
								<p>
									<a class="btn btn-info" id="export_search_results_to_csv">Export table as csv</a>
								</p>
								<!-- end of export options -->

							</div>

							<div class="table_landing" id="feature_search_table_landing"></div>
						</div>
					</div>
				</div>
			</div>
			<div class="panel panel-default">
				<div class="panel-heading">
					<h4 class="panel-title">
						Upload a bed file
					</h4>
				</div>
				<div class="panel-body">
					<p>Upload a bed file of features</p>
					<input type="file" id="feature_bed_file" />
					<p>
					<label>Instructions: </label>
						Upload a bed file containing features to calculate distances between any sets of features and genes. 
					</p>
				</div>
			</div>
		</div> <!-- end of feature search tab -->
		<div id="help_tab" class="tab-pane fade">
			<div class="panel panel-default">
				<div class="panel-heading">
					<h4 class="panel-title">
						Navigation
					</h4>
				</div>
				<div class="panel-body">
					<p>Switch chromosomes by dragging chromosome names from the circos plot onto either the top or bottom coverage bar charts to switch that plot to the new chromosome.</p>
					<p>Zoom by double-clicking the coverage bar charts and move around by dragging when you are zoomed in. Also click the + and - buttons to zoom in and out.</p>
				</div>
			</div>
		</div> <!-- end of help tab -->
	</div> <!-- end tab content class -->
</div> <!-- end of main body container -->




<script src="js/lib/d3.v3.min.js"></script>
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>
<script src="js/lib/priority-queue.min.js"></script>

<script src="js/d3-superTable.js?version=1"></script>
<script src="js/d3-livesearch.js"></script>

<script src="js/SplitThreader.js"></script>
<script src="js/saveSvgAsPng.js"></script>
<script src="js/SplitThreader_visualizer.js"></script>





